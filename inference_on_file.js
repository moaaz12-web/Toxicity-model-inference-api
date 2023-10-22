
const fs = require("fs");
const XLSX = require("xlsx");
const { google } = require("googleapis");
const { SageMakerRuntime } = require("@aws-sdk/client-sagemaker-runtime");

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
  sagemakerModel(data);
}

////////////////////////!

async function sagemakerModel(data) {
  // Create a SageMaker runtime client
  const smRuntime = new SageMakerRuntime({
    region: "us-east-1",
    credentials: {
      accessKeyId: "AKIAX2Y74JWRFSIGW2VA",
      secretAccessKey: "j7ya/F07zb1z9v3B7btQidmH5kBXqVH02xq7IxsD",
    },
  }); // Replace with your desired region

  // Emotion labels associated with cyberbullying
  const cyberbullyingLabels = ["anger", "annoyance", "disgust", "disappointment", "neutral"];

  // Dictionary to store model results
  const modelResults = {};

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
      const responseBody = response.Body;

      const textDecoder = new TextDecoder("utf-8");
      const responseString = textDecoder.decode(responseBody);
      const responseObject = JSON.parse(responseString); // Parse the JSON response

      // Update counters based on the result
      if (cyberbullyingLabels.includes(responseObject.label)) {
        modelResults[inputText] = { model: "SageMaker", label: "Cyberbullying detected" };
      } else {
        // If it's a "No cyberbullying detected" row, send it to Google Perspective API
        await perspectiveModel(inputText, modelResults);
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Log the results
  console.log("\nModel Results:");
  console.log(modelResults);
}

//////////////////!

API_KEY = "AIzaSyDZZ_33B_icDthSy7oj7rQUbwu3XUfs--s";
DISCOVERY_URL =
  "https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1";

async function perspectiveModel(text, modelResults) {
  google
    .discoverAPI(DISCOVERY_URL)
    .then((client) => {
      const analyzeRequest = {
        comment: {
          text: text,
        },
        requestedAttributes: {
          TOXICITY: {},
        },
      };

      client.comments.analyze(
        {
          key: API_KEY,
          resource: analyzeRequest,
        },
        (err, response) => {
          if (err) throw err;

          const res = JSON.stringify(
            response.data["attributeScores"]["TOXICITY"]["summaryScore"][
              "value"
            ] * 100
          );

          if (res > 50) {
            modelResults[text] = { model: "Perspective API", label: "Cyberbullying detected" };
          } else {
            modelResults[text] = { model: "Perspective API", label: "No cyberbullying detected" };
          }
        }
      );
    })
    .catch((err) => {
      throw err;
    });
}

// Specify the path to your XLSX file
const xlsxFilePath = "file.xlsx";

// Call the function to read and parse the XLSX file
readAndParseXlsx(xlsxFilePath);

