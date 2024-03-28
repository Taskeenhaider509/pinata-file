const Hapi = require('@hapi/hapi');
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const JWT = process.env.JWT;
const PINATA_API = process.env.PINATA_API;

const uploadDirectory = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory);
}

const init = async () => {
    const server = Hapi.server({
        port: process.env.PORT || 3000,
        host: 'localhost'
    });

    server.route({
        method: 'POST',
        path: '/upload',
        options: {
            payload: {
                output: 'stream',
                parse: true,
                multipart: true
            }
        },
        handler: async (request, h) => {
            try {
                const { payload } = request;

                if (!payload.file) {
                    return h.response('File not found in the request').code(400);
                }

                const fileDetails = payload.file;

                if (fileDetails.bytes === 0) {
                    return h.response('File is empty').code(400);
                }

                const { name, id } = payload;

                const fileName = `${Date.now()}_${fileDetails.hapi.filename}`;

                const fileStream = fs.createWriteStream(`./uploads/${fileName}`);

                await new Promise((resolve, reject) => {
                    fileDetails.pipe(fileStream);
                    fileDetails.on('end', resolve);
                    fileDetails.on('error', reject);
                });

                let formData = new FormData();

                formData.append("file", fs.createReadStream(`./uploads/${fileName}`));

                const response = await axios.post(PINATA_API, formData, {
                    headers: {
                        ...formData.getHeaders(),
                        "Authorization": `Bearer ${JWT}`
                    }
                });

                const pinanataResponse = response.data;
                const fileHash = pinanataResponse.IpfsHash;

                const jsonData = {
                    name,
                    id,
                    image: `https://gateway.pinata.cloud/ipfs/${fileHash}`
                };

                const jsonString = JSON.stringify(jsonData);

                const jsonFormData = new FormData();
                jsonFormData.append("file", jsonString, { filename: 'data.json' });
                const jsonResponse = await axios.post(PINATA_API, jsonFormData, {
                    headers: {
                        ...jsonFormData.getHeaders(),
                        "Authorization": `Bearer ${JWT}`
                    }
                });

                const jsonPinataResponse = jsonResponse.data;
                const jsonFileHash = jsonPinataResponse.IpfsHash;

                fs.unlinkSync(`./uploads/${fileName}`);

                return `Image File uploaded to IPFS with hash: ${fileHash}\n\nURL: https://gateway.pinata.cloud/ipfs/${fileHash}\n\nJSON File uploaded to IPFS with hash: ${jsonFileHash}\n\nURL: https://gateway.pinata.cloud/ipfs/${jsonFileHash}`;
            } catch (error) {
                console.error("Error happened while uploading the file to IPFS:", error);
                return h.response(`Error happened while uploading the file to IPFS: ${error.message}`).code(500);
            }
        }
    });

    await server.start();
    console.log(`Server running on ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
    console.error(err);
    process.exit(1);
});

init();



















































































// const Hapi = require('@hapi/hapi');
// const axios = require("axios");
// const FormData = require("form-data");
// const fs = require("fs");
// const path = require("path");
// require("dotenv").config();

// const JWT = process.env.JWT;
// const PINATA_API = process.env.PINATA_API;

// // Ensure that the uploads directory exists, create it if it doesn't
// const uploadDirectory = path.join(__dirname, "uploads");
// if (!fs.existsSync(uploadDirectory)) {
//     fs.mkdirSync(uploadDirectory);
// }

// const init = async () => {
//     const server = Hapi.server({
//         port: process.env.PORT || 3000,
//         host: 'localhost'
//     });

//     server.route({
//         method: 'POST',
//         path: '/upload',
//         options: {
//             payload: {
//                 output: 'stream',
//                 parse: true,
//                 multipart: true
//             }
//         },
//         handler: async (request, h) => {
//             try {
//                 const { payload } = request;

//                 // Check if file is included in the payload
//                 if (!payload.file) {
//                     return h.response('File not found in the request').code(400);
//                 }

//                 // Get file details from payload
//                 const fileDetails = payload.file;

//                 // Check if file is not empty
//                 if (fileDetails.bytes === 0) {
//                     return h.response('File is empty').code(400);
//                 }

//                 // Get other data from payload
//                 const { name, id } = payload;

//                 // Generate a unique file name
//                 const fileName = `${Date.now()}_${fileDetails.hapi.filename}`;

//                 // Create a writable stream to save the file
//                 const fileStream = fs.createWriteStream(`./uploads/${fileName}`);

//                 // Pipe the file to the writable stream
//                 await new Promise((resolve, reject) => {
//                     fileDetails.pipe(fileStream);
//                     fileDetails.on('end', resolve);
//                     fileDetails.on('error', reject);
//                 });

//                 // Create FormData object
//                 let formData = new FormData();

//                 // Append file to FormData
//                 formData.append("file", fs.createReadStream(`./uploads/${fileName}`));

//                 // Upload file to Pinata
//                 const response = await axios.post(PINATA_API, formData, {
//                     headers: {
//                         ...formData.getHeaders(),
//                         "Authorization": `Bearer ${JWT}`
//                     }
//                 });

//                 const pinanataResponse = response.data;
//                 const fileHash = pinanataResponse.IpfsHash;

//                 // Construct JSON object
//                 const jsonData = { name, id, fileHash };

//                 // Convert JSON object to string
//                 const jsonString = JSON.stringify(jsonData);

//                 // Upload JSON data to Pinata
//                 const jsonFormData = new FormData();
//                 jsonFormData.append("file", jsonString, { filename: 'data.json' });
//                 const jsonResponse = await axios.post(PINATA_API, jsonFormData, {
//                     headers: {
//                         ...jsonFormData.getHeaders(),
//                         "Authorization": `Bearer ${JWT}`
//                     }
//                 });

//                 const jsonPinataResponse = jsonResponse.data;
//                 const jsonFileHash = jsonPinataResponse.IpfsHash;

//                 // Delete the uploaded file after uploading to IPFS
//                 fs.unlinkSync(`./uploads/${fileName}`);

//                 return `File uploaded to IPFS with hash: ${fileHash}\n\nURL: https://gateway.pinata.cloud/ipfs/${fileHash}\n\nJSON uploaded to IPFS with hash: ${jsonFileHash}\n\nURL: https://gateway.pinata.cloud/ipfs/${jsonFileHash}`;
//             } catch (error) {
//                 console.error("Error happened while uploading the file to IPFS:", error);
//                 return h.response(`Error happened while uploading the file to IPFS: ${error.message}`).code(500);
//             }
//         }
//     });

//     await server.start();
//     console.log(`Server running on ${server.info.uri}`);
// };

// process.on('unhandledRejection', (err) => {
//     console.error(err);
//     process.exit(1);
// });

// init();





// const Hapi = require('@hapi/hapi');
// const axios = require("axios");
// const FormData = require("form-data");
// const fs = require("fs");
// const path = require("path");
// require("dotenv").config();

// const JWT = process.env.JWT;
// const PINATA_API = process.env.PINATA_API;

// // Ensure that the uploads directory exists, create it if it doesn't
// const uploadDirectory = path.join(__dirname, "uploads");
// if (!fs.existsSync(uploadDirectory)) {
//     fs.mkdirSync(uploadDirectory);
// }

// const init = async () => {
//     const server = Hapi.server({
//         port: process.env.PORT || 3000,
//         host: 'localhost'
//     });

//     server.route({
//         method: 'POST',
//         path: '/upload',
//         options: {
//             payload: {
//                 output: 'stream',
//                 parse: true,
//                 multipart: true
//             }
//         },
//         handler: async (request, h) => {
//             try {
//                 const { payload } = request;

//                 // Check if file is included in the payload
//                 if (!payload.file) {
//                     return h.response('File not found in the request').code(400);
//                 }

//                 // Get file details from payload
//                 const fileDetails = payload.file;

//                 // Check if file is not empty
//                 if (fileDetails.bytes === 0) {
//                     return h.response('File is empty').code(400);
//                 }

//                 // Generate a unique file name
//                 const fileName = `${Date.now()}_${fileDetails.hapi.filename}`;

//                 // Create a writable stream to save the file
//                 const fileStream = fs.createWriteStream(`./uploads/${fileName}`);

//                 // Pipe the file to the writable stream
//                 await new Promise((resolve, reject) => {
//                     fileDetails.pipe(fileStream);
//                     fileDetails.on('end', resolve);
//                     fileDetails.on('error', reject);
//                 });

//                 // Create FormData object
//                 let formData = new FormData();

//                 // Append file to FormData
//                 formData.append("file", fs.createReadStream(`./uploads/${fileName}`));

//                 // Upload file to Pinata
//                 const response = await axios.post(PINATA_API, formData, {
//                     headers: {
//                         ...formData.getHeaders(),
//                         "Authorization": `Bearer ${JWT}`
//                     }
//                 });

//                 const pinanataResponse = response.data;
//                 const fileHash = pinanataResponse.IpfsHash;

//                 // Delete the uploaded file after uploading to IPFS
//                 fs.unlinkSync(`./uploads/${fileName}`);

//                 return `File uploaded to IPFS with hash: ${fileHash}\n\nURL: https://gateway.pinata.cloud/ipfs/${fileHash}`;
//             } catch (error) {
//                 console.error("Error happened while uploading the file to IPFS:", error);
//                 return h.response(`Error happened while uploading the file to IPFS: ${error.message}`).code(500);
//             }
//         }
//     });

//     await server.start();
//     console.log(`Server running on ${server.info.uri}`);
// };

// process.on('unhandledRejection', (err) => {
//     console.error(err);
//     process.exit(1);
// });

// init();










// const Hapi = require('@hapi/hapi');
// const axios = require("axios");
// const FormData = require("form-data");
// const fs = require("fs");
// require("dotenv").config();

// const JWT = process.env.JWT;
// const PINATA_API = process.env.PINATA_API;

// const init = async () => {
//     const server = Hapi.server({
//         port: process.env.PORT || 3000,
//         host: 'localhost'
//     });

//     server.route({
//         method: 'POST',
//         path: '/upload',
//         handler: async (request, h) => {
//             try {
//                 let formData = new FormData();
//                 const filePath = "./files/third.jpg";
//                 const readStream = fs.createReadStream(filePath);
//                 formData.append("file", readStream);

//                 const response = await axios.post(PINATA_API, formData, {
//                     headers: {
//                         ...formData.getHeaders(),
//                         "Authorization": `Bearer ${JWT}`
//                     }
//                 });

//                 const pinanataResponse = response.data;
//                 const fileHash = pinanataResponse.IpfsHash;

//                 return `This is hash ${fileHash}\n\nhttps://gateway.pinata.cloud/ipfs/${fileHash}`;
//             } catch (error) {
//                 return h.response(`Error happened while uploading the file to IPFS: ${error.message}`).code(500);
//             }
//         }
//     });

//     await server.start();
//     console.log(`Server running on ${server.info.uri}`);
// };

// process.on('unhandledRejection', (err) => {
//     console.error(err);
//     process.exit(1);
// });

// init();