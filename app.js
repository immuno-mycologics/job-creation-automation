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
                        axios.post('https://immy2700.sharepoint.com/sites/Production/_api/web/GetFolderByServerRelativeURL' +
                            '(\'/sites/Production/Shared Documents/Production Data/ERP Folder/' + item + '/' + itemLotJob + '/\')/Files/add(url=\'' + reportFileName + '\',overwrite=true)'
                            , buffer, config1)
                            .then(function (resp) {
                                //  console.log(resp.data);
                                fetch(modPath1)
                                    .then(res => res.buffer())
                                    .then(buffer => {
                                        let reportFileName1 = "CCGJobMaterialPickList80.pdf"
                                        axios.post('https://immy2700.sharepoint.com/sites/Production/_api/web/GetFolderByServerRelativeURL' +
                                            '(\'/sites/Production/Shared Documents/Production Data/ERP Folder/' + item + '/' + itemLotJob + '/\')/Files/add(url=\'' + reportFileName1 + '\',overwrite=true)'
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

    axios.post('https://immy2700.sharepoint.com/sites/Production/_api/web/folders',{
            "__metadata": {
                "type": "SP.Folder"
            },
            "ServerRelativeUrl": "https://immy2700.sharepoint.com/sites/Production/Shared Documents/Production Data/ERP Folder/"+item+"/"+itemLotJob
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
    console.log("Report: "+outputPath)
    sql.connect(conn).then(pool => {
        return pool.request()
            .query(`select DocumentNumber from IMMYETQDocuments where item = '` + item + `'`)
    }).then(result => {
        console.log(result.recordset)
        if (result.recordset) {
            for (let i = 0; i < result.recordset.length; i++) {
                let docNum = result.recordset[i].DocumentNumber
                console.log("183 "+docNum)
                let config = {
                    method: 'get',
                    url: 'https://immy.etq.com/prod/rest/v1/dao/DOCWORK/DOCWORK_DOCUMENT/where?&keys=ETQ$NUMBER&values='+docNum+'&pagesize=1000&columns=DOCWORK_ID&ordercolumns=ETQ$COMPLETED_DATE D',
                    headers: {
                        'Authorization': 'Basic V1NfUHJvZF9JTU1ZOkcydmIzancx'
                    }
                };
                axios(config)
                    .then(function (response) {
                        console.log("193: "+response)
                        let docIDs = CircularJSON.stringify(response.data.Records);
                        console.log("197: "+docIDs)
                        for (let j = 0; j < docIDs.length; j++){
                            //@ts-ignore
                            let x = CircularJSON.stringify(response.data.Records[j].Columns[0].value)
                            console.log("198: " +x);
                            getFile2(itemLotJob, authToken, x , item, outputPath)
                        }
                    }).catch(function (error) {
                    console.log(error);
                });
            }
        }
    }).catch(function (error) {
        console.log(error);
    });
}

async function getFile2(itemLotJob, authToken, docID, item, outputPath) {
    console.log("Entering file 2")
    let docNum = docID.replace(/"/g,'');
    console.log("214: "+docNum)
    console.log('https://immy.etq.com/prod/rest/v1/documents/DOCWORK/DOCWORK_DOCUMENT/'+docNum)


    let config = {
        method: 'get',
        url: 'https://immy.etq.com/prod/rest/v1/documents/DOCWORK/DOCWORK_DOCUMENT/'+docNum,
        headers: {
            'Authorization': 'Basic V1NfUHJvZF9JTU1ZOkcydmIzancx'
        }
    };
    axios(config)
        .then(function (response) {
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
                    console.log(fileName)
                    let url = "https://immy.etq.com/prod/rest/v1/attachments?path="+path+"&name="+fileName+""
                    console.log(url);
                    let config1 = {
                        method: 'get',
                        url: "https://immy.etq.com/prod/rest/v1/attachments?path="+path+"&name="+fileName+"",
                        headers: {
                            'Authorization': 'Basic V1NfUHJvZF9JTU1ZOkcydmIzancx'
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
                            axios.post('https://immy2700.sharepoint.com/sites/Production/_api/web/GetFolderByServerRelativeURL' +
                                '(\'/sites/Production/Shared Documents/Production Data/ERP Folder/'+item+'/'+itemLotJob+'/\')/Files/add(url=\''+itemLotJob+ ' '+fileName+'\',overwrite=true)'
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

app.listen(80, "0.0.0.0", ()=>console.log("Listening on port: " + 80));
https.createServer({} , app).listen(443, "0.0.0.0", ()=>console.log("Booted up https"));
module.exports = app;
