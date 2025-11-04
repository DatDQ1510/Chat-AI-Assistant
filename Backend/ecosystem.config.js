
module.exports = {
    apps: [
        {
            name: "API-Server",
            script: "dist/server.js"
        },
        {
            name: "Job-Worker",
            script: "dist/job/index.js"
        }
    ]
};