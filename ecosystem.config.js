module.exports = {
    apps: [{
        name: "docvision",
        script: "server.js",
        env_production: {
            NODE_ENV: "production"
        }
    }],
};