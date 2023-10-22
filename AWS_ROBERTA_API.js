// //! INSTALL THESE COMMANDS VIA TERMINAL FIRST
// npm i xlsx
// npm i aws-sdk
// npm i @aws-sdk/client-sagemaker-runtime
// npx aws-sdk-js-codemod -t v2-to-v3 u.js
// npm i googleapis

const fs = require("fs");
const XLSX = require("xlsx");
const { SageMakerRuntime } = require("@aws-sdk/client-sagemaker-runtime");
require("dotenv").config();

// Function to read and parse the XLSX file
function readAndParseXlsx(filePath) {
  // Read the XLSX file
  const fileContent = fs.readFileSync(filePath);

  // Parse the XLSX data using xlsx
  const workbook = XLSX.read(fileContent, { type: "buffer" });
  const sheetName = workbook.SheetNames[0]; // Assuming there is only one sheet
  const sheet = workbook.Sheets[sheetName];

  // Convert sheet to an array of objects
  const data = XLSX.utils.sheet_to_json(sheet, { header: "A", defval: "" });

  // Handle the parsed data
  printRows(data);
}

// Function to print each row to the console and invoke SageMaker endpoint
async function printRows(data) {
  // Create a SageMaker runtime client
  const smRuntime = new SageMakerRuntime({
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.accessKeyId,
      secretAccessKey: process.env.secretAccessKey,
    },
  }); // Replace with your desired region

  // Counters
  let noCyberbullyingCount = 0;
  let cyberbullyingCount = 0;
  let totalCount = 0;

  // Emotion labels associated with cyberbullying
  const cyberbullyingLabels = ["anger", "annoyance", "disgust", "disappointment", "neutral"];

  // Iterate through each row
  for (const row of data) {
    // Assuming 'text' is the column in your XLSX file
    const inputText = row.A;

    // Input data
    const inputData = JSON.stringify({ text: inputText });

    // Invoke the SageMaker endpoint
    const params = {
      EndpointName: "Model", // Replace with your endpoint name
      ContentType: "application/json",
      Body: inputData,
    };

    try {
      const response = await smRuntime.invokeEndpoint(params);
      const responseBody = await response.Body;
      
      const textDecoder = new TextDecoder("utf-8");
      const responseString = textDecoder.decode(responseBody);
      const responseObject = JSON.parse(responseString); // Parse the JSON response

      // Update counters based on the result
      if (cyberbullyingLabels.includes(responseObject.label)) {
        cyberbullyingCount++;
      } else {
        noCyberbullyingCount++;
      }

      // Log the result for each row
      console.log(
        `Row: ${JSON.stringify(row.A)}, Result: ${
          cyberbullyingLabels.includes(responseObject.label)
            ? "Cyberbullying detected"
            : "No cyberbullying detected"
        }`
      );
    } catch (error) {
      console.error(error);
    }

    // Increment the total count
    totalCount++;
  }

  // Print counts at the end
  console.log("\nSummary:");
  console.log(`No Cyberbullying Count: ${noCyberbullyingCount}`);
  console.log(`Cyberbullying Count: ${cyberbullyingCount}`);
  console.log(`Total Rows: ${totalCount}`);
}

// Specify the path to your XLSX file
const xlsxFilePath = "file.xlsx";

// Call the function to read and parse the XLSX file
readAndParseXlsx(xlsxFilePath);
