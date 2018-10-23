const express = require('express')
const bodyParser = require('body-parser')
const bigquery = require('@google-cloud/bigquery')();
const { Storage } = require('@google-cloud/storage');

const storage = new Storage();

const RESPONSE = {
    BAD_REQUEST: 400
}

// Set Project ID
const projectId = "monplan-prod" 

const fileNamePrefix = 'all_namespaces_kind_'


// Kinds 
const targetKinds = [
    'User',
    'SnapshotApproval',
    'SnapshotFeedback'
]

// CORS Headers
const allowCORSHeaders = [
    'cache-control', 
    'content-type', 
    'x-requested-with', 
    'pragma', 
    'x-xsrf-token'
]
  
exports.gcfBigquery = (req, res) => {
    console.log('Setting CORS headers.');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', allowCORSHeaders.join(', '));
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');

    // Return OK for OPTIONS request
    if (req.method === 'OPTIONS') {
        console.log('Returning OPTIONS request.');
        res.send(200);
        return;
    }

    const today = new Date();
    const date = today.getDate();
    var month = today.getMonth();
    if(month.toString.length === 1){
        month = `0${month.toString}`
    }
    const year = today.getFullYear();
    const bucket = `gs://${projectId}-backup`
    const dateString = `${year}${month}${date}`
    const backupLocation = `/exports/${dateString}/all_namespaces`

    targetKinds.forEach((kind) => {
        const dataset = bigquery.dataset("MONPLAN_DATASETS");
  
        const kindBackup = `${backupLocation}/kind_${kind}/${fileNamePrefix}${kind}.export_metadata`
        
        dataset.get({autoCreate: true})
            .then(([dataset]) => {
                return dataset.table(`${kind}_${dateString}`).get({autoCreate: true});
            })
            .then(([table]) => {
                const fileObj = storage.bucket(`${bucket}`).file(`${kindBackup}`);
                console.log(`Starting job`);
                const metadata = {
                    autodetect: true,
                    sourceFormat: 'DATASTORE_EXPORT'
                };
                table.load(fileObj, metadata)
                .then(([job]) => job.promise())
                .then(() => {
                    res.send({message: 'Success!'})
                    console.log(`Job complete`)
                })
                .catch((err) => {
                    console.log(`Job failed`);
                    throw Error(err)
                });
            })
    })
}

// ******************************
// UNCOMMENT THIS TO TEST LOCALLY
//    THIS IS NOT USED BY GCF
// ******************************

// Set up Express configuration and middleware
// const app = express();
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());

// // Define routes
// app.post('/', exports.gcfBigquery);

// // Start the server
// app.listen(process.env.PORT || 8080);

// ******************************
// ******************************