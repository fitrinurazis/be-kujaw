const swaggerUi = require("swagger-ui-express");
const swaggerOutput = require("./swagger_output.json");
const fs = require("fs");
const path = require("path");

const docs = (app) => {
  const css = fs.readFileSync(
    path.resolve(
      __dirname,
      "../../node_modules/swagger-ui-dist/swagger-ui.css"
    ),
    "utf8"
  );

  const options = {
    customCss: css + `.swagger-ui .topbar { display: none }`,
    customSiteTitle: "KUJAW API Documentation",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
      operationsSorter: (a, b) => {
        const methodsOrder = ["get", "post", "put", "delete"];
        const compare =
          methodsOrder.indexOf(a.get("method")) -
          methodsOrder.indexOf(b.get("method"));
        if (compare === 0) return a.get("path").localeCompare(b.get("path"));
        return compare;
      },
      tagsSorter: "alpha",
      docExpansion: "none",
      deepLinking: true,
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
      showExtensions: true,
      showCommonExtensions: true,
    },
  };

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerOutput, options)
  );
};

module.exports = docs;
