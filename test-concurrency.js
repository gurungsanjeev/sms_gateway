
const URL = "http://localhost:8000/api/sms/send";

// Paste the JWT token from your test user's login here.
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3ZDZlNTFlMC1hNjcxLTQ2YjgtYWY1NC05NDRjYzQ2N2VhZGYiLCJpYXQiOjE3OTMwODU4ODIsImV4cCI6MTc5MzA4OTQ4Mn0.CGRIS6qQccEHk00X9ZaEaOFoBmfVoQP4ZRsoihgRjOU";

const TOTAL_REQUESTS = 20;

const sendRequest = async (requestNumber) => {
    try {
        const response = await fetch(URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${TOKEN}`,
            },
            body: JSON.stringify({
                to: ["9841234567"],
                message: "Hi",
            }),
        });

        const data = await response.json();

        return {
            requestNumber,
            httpStatus: response.status,
            success: data.success,
            message: data.message,
        };
    } catch (error) {
        return {
            requestNumber,
            error: error.message,
        };
    }
};

const main = async () => {
    console.log(`Sending ${TOTAL_REQUESTS} requests in parallel...\n`);

    const results = await Promise.all(
        Array.from({ length: TOTAL_REQUESTS }, (_, index) =>
            sendRequest(index + 1)
        )
    );

    console.table(results);

    const accepted = results.filter(
        (result) => result.httpStatus === 200 && result.success === true
    ).length;

    const rejected = results.filter(
        (result) =>
            result.httpStatus === 400 &&
           /insufficient.*credits/i.test(result.message ?? "")
    ).length;

    console.log("\n--- Concurrency Test Summary ---");
    console.log(`Successful requests: ${accepted}`);
    console.log(`Insufficient-credit rejections: ${rejected}`);
    console.log(`Other responses/errors: ${TOTAL_REQUESTS - accepted - rejected}`);
};

main();
