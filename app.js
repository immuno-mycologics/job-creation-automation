let axios = require('axios')
let express = require('express');
let app = express();
let router = express.Router
let mkdirp = require('mkdirp');
const sql = require('mssql');
const fs = require('fs');
const https = require('http');
let bodyParser = require('body-parser')
const request = require("request-promise-native");
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
let fetch = require('node-fetch');
const buffer = require("buffer");
var CircularJSON = require('circular-json');

let accessToken;

const conn =
    {
        user: 'immydev',
        password: 'Immyforce4life!',
        server: '164.90.42.150',
     //   server: 'IMMY-VM-SQL',
        database: 'IMMY_App',
        trustServerCertificate: true,
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        },
        options: {
            enableArithAbort: true
        }
    }


app.post('/api/createDirectory', async (req, res) => {
    let Job = req.body.Job.replace(/\s/g,'')
    let itemLotJob = req.body.Item+' - '+req.body.Lot+' - '+Job;
    let outputPath = req.body.OutputPath;
    let item = req.body.Item
    res.send("Received")
    getAuthToken(itemLotJob, item, outputPath);

})

app.post('/api/uploadReport', async (req, res) => {

    console.log(req.body)
    let Job = req.body.Job.replace(/\s/g,'')
    let itemLotJob = req.body.Item+' - '+req.body.Lot+' - '+Job;
    let item = req.body.Item;

    let config = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };

    axios.post('https://accounts.accesscontrol.windows.net/f1f1b8d0-6c95-49c7-bea5-ad1ad4acace6/tokens/OAuth/2',{
        grant_type: 'client_credentials',
        client_id: '187a1f2d-88d7-422c-bf8d-51f94c9b4d79@f1f1b8d0-6c95-49c7-bea5-ad1ad4acace6',
        client_secret: 'a0xZOFF+MlRVd3BkMmxGck5UZ0phQUJwbUM1UVV1M2QzVm5pMmM1Rw==',
        resource: '00000003-0000-0ff1-ce00-000000000000/immy2700.sharepoint.com@f1f1b8d0-6c95-49c7-bea5-ad1ad4acace6'
    },config)
        .then(function (response) {
            console.log(response.data);
            let accessToken = response.data.access_token;
            if (accessToken){
                let config1 = {
                    headers: {
                        'Accept': 'application/json;odata=nometadata',
                        'Authorization': 'Bearer '+accessToken,
                        'X-RequestDigest': '0x703AE026F5E314B4F898AE91F77BDA1D192553AD50585C5018FCE8BD69BA6DC71EA26D88A4E650235663C76804D9048B2E7D1FB786702F2B4D97FCCC33B90ED9'
                    }
                };
                let modPath = req.body.OutputPath.replace("https://inforapp.immy.com","http://164.90.42.150:1435");
                let modPath1 = req.body.OutputPath1.replace("https://inforapp.immy.com","http://164.90.42.150:1435");

                console.log(modPath)
                console.log(modPath1)
                fetch(modPath)
                    .then(res => res.buffer())
                    .then(buffer => {
                        let reportFileName = "JobOperationListingReport.pdf"
                        axios.post('https://immy2700.sharepoint.com/sites/ProductionData/_api/web/GetFolderByServerRelativeURL' +
                            '(\'/sites/ProductionData/Shared Documents/Production Data/ERP Folder/' + item + '/' + itemLotJob + '/\')/Files/add(url=\'' + reportFileName + '\',overwrite=true)'
                            , buffer, config1)
                            .then(function (resp) {
                                //  console.log(resp.data);
                                fetch(modPath1)
                                    .then(res => res.buffer())
                                    .then(buffer => {
                                        let reportFileName1 = "CCGJobMaterialPickList80.pdf"
                                        axios.post('https://immy2700.sharepoint.com/sites/ProductionData/_api/web/GetFolderByServerRelativeURL' +
                                            '(\'/sites/ProductionData/Shared Documents/Production Data/ERP Folder/' + item + '/' + itemLotJob + '/\')/Files/add(url=\'' + reportFileName1 + '\',overwrite=true)'
                                            , buffer, config1)
                                            .then(function (resp) {
                                                //  console.log(resp.data);
                                            })
                                            .catch(function (error) {
                                                console.log(error.response.data);
                                            });
                                    })
                            })
                            .catch(function (error) {
                                console.log(error.response.data);
                            });
                    })
            }
        })
        .catch(function (error) {
            console.log(error);
        });
})


async function getAuthToken(itemLotJob, item, outputPath){

    let config = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    };

    axios.post('https://accounts.accesscontrol.windows.net/f1f1b8d0-6c95-49c7-bea5-ad1ad4acace6/tokens/OAuth/2',{
        grant_type: 'client_credentials',
        client_id: '187a1f2d-88d7-422c-bf8d-51f94c9b4d79@f1f1b8d0-6c95-49c7-bea5-ad1ad4acace6',
        client_secret: 'a0xZOFF+MlRVd3BkMmxGck5UZ0phQUJwbUM1UVV1M2QzVm5pMmM1Rw==',
        resource: '00000003-0000-0ff1-ce00-000000000000/immy2700.sharepoint.com@f1f1b8d0-6c95-49c7-bea5-ad1ad4acace6'
    },config)
        .then(function (response) {
            console.log(response.data);
            let accessToken = response.data.access_token;
            if (accessToken){
                createFolder(accessToken, itemLotJob, item, outputPath);
            }
        })
        .catch(function (error) {
            console.log(error);
        });
}

async function createFolder(authToken, itemLotJob, item, outputPath){

    let config = {
        headers: {
            'Content-Type': 'application/json;odata=verbose',
            'Accept': 'application/json;odata=verbose',
            'Authorization': 'Bearer '+authToken
        }
    };

    console.log(itemLotJob)
    console.log(authToken)
    console.log(item)

    axios.post('https://immy2700.sharepoint.com/sites/ProductionData/_api/web/folders',{
            "__metadata": {
                "type": "SP.Folder"
            },
            "ServerRelativeUrl": "https://immy2700.sharepoint.com/sites/ProductionData/Shared Documents/Production Data/ERP Folder/"+item+"/"+itemLotJob
        },config)
            .then(function (response) {
              //  console.log(response.data);
                getFile1(itemLotJob, authToken, item, outputPath);
            })
            .catch(function (error) {
                console.log(error);
            });
}
async function getFile1(itemLotJob, authToken, item, outputPath) {
    accessToken = await getAccessToken();
    const headers = {
        'Authorization': 'Bearer '+accessToken
    }
    console.log("Report: "+outputPath)
    sql.connect(conn).then(pool => {
        return pool.request()
        .query(`select DocumentNumber from IMMYETQDocuments where item = '` + item + `'`)
    }).then(async (result) => {
        if (result.recordset) {
            let docIDs = []
            const docNumbers = result.recordset.map(record => record.DocumentNumber)
            console.log(docNumbers)
            try{
                let response = await axios.get(
                    'https://immy.api.etq.com/reliance/rest/v1/datasources/DOCWORK_CLOSED_MASTERLIST/execute?pagesize=2000',   
                    {
                      headers
                    }
                );
            response.data.Records.some(record => {
                if(docNumbers.length == docIDs.length){
                    return true
                }
                const docNumber = record.Columns.find(column => column.name === 'DOCUMENT_NUMBER')?.value
                if(docNumbers.includes(docNumber)){
                    docIDs.push(record.Columns[0].value)
                }
                return false
            })
            console.log(docIDs)
            docIDs.map(docID => {
               getFile2(itemLotJob, authToken, docID, item, outputPath)
                })
            }
            catch(error){
                console.log(error)
            }
        }
    }).catch(function (error) {
        console.log(error);
    });
}



async function getFile2(itemLotJob, authToken, docID, item, outputPath) {
    accessToken =  await getAccessToken();
    console.log("Entering file 2")
    let docNum = docID.replace(/"/g,'');
    console.log("214: "+docNum)

    let config = {
        method: 'get',
        url: 'https://immy.api.etq.com/reliance/rest/v1/documents/DOCWORK/DOCWORK_DOCUMENT/'+docNum,
        headers: {
           // 'Authorization': 'Basic V1NfUHJvZF9JTU1ZOkcydmIzancx'
            'Authorization': 'Bearer '+accessToken
        }
    };
    axios(config)
        .then(function (response) {
            console.log(response.data.Document[0])
            console.log(response.data.Document[0].Fields[21]);
            let phase = response.data.Document[0].phase
            console.log("Phase: "+phase)
            if(phase.includes("APPROVED")){
                console.log("File Approved..")
                let x = response.data.Document[0].Fields[21].attachmentPath;
                console.log("228: " +response.data.Document[0].Fields[21].Values[0]);
                let path = x.replace(/\\/g,"/");
                let fileNames = response.data.Document[0].Fields[21].Values
                for(let i = 0; i < fileNames.length; i++){
                    let fileName = response.data.Document[0].Fields[21].Values[i]
                    let config1 = {
                        method: 'get',
                        url: "https://immy.api.etq.com/reliance/rest/v1/attachments?path="+path+"&name="+fileName+"",
                        headers: {
                           // 'Authorization': 'Basic V1NfUHJvZF9JTU1ZOkcydmIzancx'
                            'Authorization': 'Bearer '+accessToken
                        },
                        responseType: 'arraybuffer'
                    };
                    axios(config1)
                        .then(function (response1) {
                            let config = {
                                headers: {
                                    'Accept': 'application/json;odata=nometadata',
                                    'Authorization': 'Bearer '+authToken,
                                    'X-RequestDigest': '0x703AE026F5E314B4F898AE91F77BDA1D192553AD50585C5018FCE8BD69BA6DC71EA26D88A4E650235663C76804D9048B2E7D1FB786702F2B4D97FCCC33B90ED9'
                                }
                            };
                            console.log(response1.data)
                            axios.post('https://immy2700.sharepoint.com/sites/ProductionData/_api/web/GetFolderByServerRelativeURL' +
                                '(\'/sites/ProductionData/Shared Documents/Production Data/ERP Folder/'+item+'/'+itemLotJob+'/\')/Files/add(url=\''+itemLotJob+ ' '+fileName+'\',overwrite=true)'
                                ,response1.data,config)
                                .then(function (resp) {
                                    console.log("Created ETQ files successfully!");
                                    // reportUpload(outputPath, item, itemLotJob, config);
                                })
                                .catch(function (error) {
                                    console.log(error.response.data);
                                });
                        })
                }
            }
            else{
                console.log("Document not approved...")
            }

        })
        .catch(function (error) {
            console.log(error);
        });
}

const getAccessToken = async () => {
        const tokenUrl = 'https://reliance-auth-prod-3003.auth.us-east-1.amazoncognito.com/oauth2/token'; 
    const clientId = '6cosjmq0kpprnhpld2qpdgkvm8'; // Replace with your Client ID
    const clientSecret = '10up4od44b75rlq03gfbgvlk7k4h5c1blirag4rubpc62n94c92i'; // Replace with your Client Secret

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);

    try {
        const response = await axios.post(tokenUrl, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        console.log('Access Token:', response.data.access_token);
        return response.data.access_token;
    } catch (error) {
        console.error('Error fetching access token:', error.response?.data || error.message);
    }
};


//getAccessToken();
app.listen(80, "0.0.0.0", ()=>console.log("Listening on port: " + 80));
https.createServer({} , app).listen(443, "0.0.0.0", ()=>console.log("Booted up https"));
module.exports = app;
