const { google } = require("googleapis");
const { SageMakerRuntime } = require("@aws-sdk/client-sagemaker-runtime");


async function sagemakerModel(inputText) {
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
      
      // Log the results
      console.log("\nModel Results:");
      console.log(modelResults);
}



API_KEY = "AIzaSyDZZ_33B_icDthSy7oj7rQUbwu3XUfs--s";
DISCOVERY_URL =
  "https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1";
  async function perspectiveModel(text, modelResults) {
    return new Promise((resolve, reject) => {
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
              if (err) reject(err);
  
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
  
              resolve(); // Resolve the promise once the Perspective API call is complete
            }
          );
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

text = "Haha youre so bitch"
//! Try "Haha youre so bitch" and Perspective model will be used cus AWS sagemaker model cant detect it.
//! Try "youre so bitch" and AWS sagemaker model will be used, as it can detect it

// Call the function to read and parse the XLSX file
sagemakerModel(text);