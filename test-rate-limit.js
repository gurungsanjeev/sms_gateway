
const URL = "http://localhost:8000/api/test-rate-limit/check";

// jwt from the login users
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxY2I4NjNkMi1hNGMyLTRhNTctOTc3ZC00ZDI1ODZhOTRhZTEiLCJpYXQiOjE3OTMyNjYxMjUsImV4cCI6MTc5MzI2OTcyNX0.SLWSd-mhWiN8QVtOXt6n2gNMc6mdbXtD1c6rMqI_w34";

const TOTAL_REQUESTS = 61;

async function sendRequest(requestNumber) {
    try {

        const response = await fetch(URL, {
            method: "GET",
            headers: {
                Cookie: `token=${TOKEN}`,
            },
        });




        const rawResponse = await response.text();

        let data;
        //  parsing data into JSON
        try {
            data = JSON.parse(rawResponse);
        } catch {
            data = {
                message: rawResponse.slice(0, 200),
            };
        }



        return {
            requestNumber,
            status: response.status,
            message: data.message,
        };
    } catch (error) {
        return {
            requestNumber,
            status: "ERROR",
            message: error.message,
        };
    }
}

async function main() {
    console.log(`Sending ${TOTAL_REQUESTS} parallel requests...\n`);

    const results = await Promise.all(
        Array.from({ length: TOTAL_REQUESTS }, (_, index) =>
            sendRequest(index + 1)
        )
    );


    // Selecting those result whose status is 429
    const rateLimited = results.filter(
        (result) => result.status === 429
    ).length;  // counts how many results were selected(blocked)


    // selecting passed result and counting 
    const passedLimiter = results.filter(
        (result) => result.status !== 429 && result.status !== "ERROR"
    ).length;


    // counting the network error
    const errors = results.filter(
        (result) => result.status === "ERROR"
    ).length;

    console.table(results);

    console.log("\n--- Rate Limit Test Summary ---");
    console.log(`Requests not rate-limited: ${passedLimiter}`);
    console.log(`HTTP 429 responses: ${rateLimited}`);
    console.log(`Network errors: ${errors}`);
}

main();
