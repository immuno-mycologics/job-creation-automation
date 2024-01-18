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

const conn =
    {
        user: 'immydev',
        password: 'Immyforce4life!',
        server: '164.90.42.150',
     //   server: 'IMMY-VM-SQL',
        database: 'dIMMY_App',
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
        client_secret: 'm9Q/ZEsFrKDGXe7L3ZKe2rooWhyj+2rcT/w34AQbhpY=',
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
                let modPath = req.body.OutputPath.replace("https://inforapp.immy.com","http://164.90.42.150:1435")

                console.log(modPath)
                fetch(modPath)
                    .then(res => res.buffer())
                    .then(buffer => {
                        let reportFileName = "JobOperationListingReport.pdf"
                        axios.post('https://immy2700.sharepoint.com/sites/production-automation/_api/web/GetFolderByServerRelativeURL' +
                            '(\'/sites/production-automation/Shared Documents/Production Data/' + item + '/' + itemLotJob + '/\')/Files/add(url=\'' + reportFileName + '\',overwrite=true)'
                            , buffer, config1)
                            .then(function (resp) {
                                //  console.log(resp.data);
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
        client_secret: 'm9Q/ZEsFrKDGXe7L3ZKe2rooWhyj+2rcT/w34AQbhpY=',
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

    axios.post('https://immy2700.sharepoint.com/sites/production-automation/_api/web/folders',{
            "__metadata": {
                "type": "SP.Folder"
            },
            "ServerRelativeUrl": "https://immy2700.sharepoint.com/sites/production-automation/Shared Documents/Production Data/"+item+"/"+itemLotJob
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
            .query(`select DOCID from IMMYETQDocuments where item = '` + item + `'`)
    }).then(result => {
        console.log(result.recordset[0].DOCID)
        if (result.recordset) {
            for (let i = 0; i < result.recordset.length; i++) {
                getFile2(itemLotJob, authToken, result.recordset[i].DOCID, item, outputPath)
            }
        }
    }).catch(function (error) {
        console.log(error);
    });
}

async function getFile2(itemLotJob, authToken, docID, item, outputPath) {
    let config = {
        method: 'get',
        url: 'https://immy.etq.com/prod/rest/v1/documents/DOCWORK/DOCWORK_DOCUMENT/'+docID,
        headers: {
            'Authorization': 'Basic V1NfUHJvZF9JTU1ZOkcydmIzancx'
        }
    };
    axios(config)
        .then(function (response) {
            console.log(response.data.Document[0].Fields[16]);
            let x = response.data.Document[0].Fields[16].attachmentPath;
            console.log(response.data.Document[0].Fields[16].Values[0]);
            let path = x.replace(/\\/g,"/");
            let fileName = response.data.Document[0].Fields[16].Values[0]
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
                    axios.post('https://immy2700.sharepoint.com/sites/production-automation/_api/web/GetFolderByServerRelativeURL' +
                        '(\'/sites/production-automation/Shared Documents/Production Data/'+item+'/'+itemLotJob+'/\')/Files/add(url=\''+itemLotJob+ ' '+fileName+'\',overwrite=true)'
                        ,response1.data,config)
                        .then(function (resp) {
                              console.log("Created ETQ files successfully!");
                             // reportUpload(outputPath, item, itemLotJob, config);
                        })
                        .catch(function (error) {
                            console.log(error.response.data);
                        });
                })

        })
        .catch(function (error) {
            console.log(error);
        });
}

/*async function reportUpload(outputPath, item, itemLotJob, config) {
    let modPath = outputPath.replace("https://inforapp.immy.com","http://164.90.42.150:1435")
    console.log(modPath)
    fetch(modPath)
        .then(res => res.buffer())
        .then(buffer => {
            let reportFileName = "JobOperationListingReport.pdf"
            axios.post('https://immy2700.sharepoint.com/sites/production-automation/_api/web/GetFolderByServerRelativeURL' +
                '(\'/sites/production-automation/Shared Documents/Production Data/' + item + '/' + itemLotJob + '/\')/Files/add(url=\'' + reportFileName + '\',overwrite=true)'
                , buffer, config)
                .then(function (resp) {
                    //  console.log(resp.data);
                })
                .catch(function (error) {
                    console.log(error.response.data);
                });
        })
}*/


/*function testingOn(){
    axios.get('https://curlmyip.org')
        .then((response) => {
            console.log(response.data);

        });
    fetch('http://164.90.42.150:1435/SLReports/Report/OutputFiles/sreenath-umagandhi@immy.com/CCGJobOperationListing_DIMMY_264946.pdf')
        .then(res => res.buffer())
        .then(buffer => {
            console.log("success")
            console.log(buffer)
        }).catch(function (err){
            console.log(err);
    })
}*/

app.listen(80, "0.0.0.0", ()=>console.log("Listening on port: " + 80));
https.createServer({} , app).listen(443, "0.0.0.0", ()=>console.log("Booted up https"));
module.exports = app;
