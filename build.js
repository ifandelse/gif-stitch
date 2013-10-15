({
    mainConfigFile : "js/main.js",
    appDir: "./",
    baseUrl: "js",
    removeCombined: true,
    findNestedDependencies: true,
    dir: "dist",
    optimize: "none",
    optimizeCss: "standard",
    modules: [
        {
            name: "main",
            exclude: [
                "infrastructure"
            ]
        },
        {
            name: "infrastructure"
        }
    ],
    paths: {
        machina: "empty:"
    },
    generateSourceMaps: true
})