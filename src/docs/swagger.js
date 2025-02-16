const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    version: "v1.0.0",
    title: "KUJAW API Documentation",
    description: "Complete API Documentation for KUJAW Application",
    contact: {
      name: "KUJAW Support",
      email: "support@kujaw.com",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: "http://localhost:5000/api",
      description: "Development Server",
    },
    {
      url: "https://api.kujaw.com/api",
      description: "Production Server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      User: {
        type: "object",
        required: ["email", "password", "name"],
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password", minLength: 6 },
          name: { type: "string", minLength: 2 },
          role: { type: "string", enum: ["admin", "user", "sales"] },
          avatar: { type: "string", format: "binary" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Product: {
        type: "object",
        required: ["name", "price", "categoryId"],
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          price: { type: "number", minimum: 0 },
          description: { type: "string" },
          categoryId: { type: "string", format: "uuid" },
          image: { type: "string", format: "binary" },
          stock: { type: "integer", minimum: 0 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Transaction: {
        type: "object",
        required: ["customerId", "details"],
        properties: {
          id: { type: "string", format: "uuid" },
          customerId: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          type: { type: "string", enum: ["income", "expense"] },
          details: {
            type: "array",
            items: {
              type: "object",
              properties: {
                productId: { type: "string", format: "uuid" },
                quantity: { type: "integer", minimum: 1 },
                pricePerUnit: { type: "number", minimum: 0 },
              },
            },
          },
          totalAmount: { type: "number", minimum: 0 },
          proofImage: { type: "string", format: "binary" },
          transactionDate: { type: "string", format: "date-time" },
        },
      },
      Customer: {
        type: "object",
        required: ["name", "email"],
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          phone: { type: "string" },
          nimSiakad: { type: "string" },
          class: { type: "string" },
          progdi_id: { type: "string", format: "uuid" },
        },
      },
    },
  },
  tags: [
    {
      name: "Auth",
      description: "Authentication endpoints",
      endpoints: [
        {
          path: "/auth/register",
          method: "POST",
          description: "Register new user",
        },
        { path: "/auth/login", method: "POST", description: "User login" },
        {
          path: "/auth/profile",
          method: "GET",
          description: "Get user profile",
        },
        {
          path: "/auth/change-password",
          method: "POST",
          description: "Change password",
        },
        { path: "/auth/logout", method: "POST", description: "User logout" },
      ],
    },
    {
      name: "Users",
      description: "User management",
      endpoints: [
        {
          path: "/users/profile",
          method: "GET",
          description: "Get user profile",
        },
        {
          path: "/users/profile",
          method: "PUT",
          description: "Update user profile",
        },
        {
          path: "/users/sales",
          method: "GET",
          description: "Get all sales users",
        },
        {
          path: "/users/sales",
          method: "POST",
          description: "Create sales user",
        },
        {
          path: "/users/sales/{id}",
          method: "PUT",
          description: "Update sales user",
        },
        {
          path: "/users/sales/{id}",
          method: "DELETE",
          description: "Delete sales user",
        },
      ],
    },
    {
      name: "Products",
      description: "Product management",
      endpoints: [
        { path: "/products", method: "GET", description: "Get all products" },
        {
          path: "/products/{id}",
          method: "GET",
          description: "Get product by ID",
        },
        {
          path: "/products",
          method: "POST",
          description: "Create new product",
        },
        {
          path: "/products/{id}",
          method: "PUT",
          description: "Update product",
        },
        {
          path: "/products/{id}",
          method: "DELETE",
          description: "Delete product",
        },
      ],
    },
    {
      name: "Categories",
      description: "Category management",
      endpoints: [
        {
          path: "/categories",
          method: "GET",
          description: "Get all categories",
        },
        {
          path: "/categories",
          method: "POST",
          description: "Create new category",
        },
        {
          path: "/categories/{id}",
          method: "PUT",
          description: "Update category",
        },
        {
          path: "/categories/{id}",
          method: "DELETE",
          description: "Delete category",
        },
      ],
    },
    {
      name: "Customers",
      description: "Customer management",
      endpoints: [
        { path: "/customers", method: "GET", description: "Get all customers" },
        {
          path: "/customers/{id}",
          method: "GET",
          description: "Get customer by ID",
        },
        {
          path: "/customers",
          method: "POST",
          description: "Create new customer",
        },
        {
          path: "/customers/{id}",
          method: "PUT",
          description: "Update customer",
        },
        {
          path: "/customers/{id}",
          method: "DELETE",
          description: "Delete customer",
        },
        {
          path: "/customers/{id}/transactions",
          method: "GET",
          description: "Get customer transactions",
        },
      ],
    },
    {
      name: "Transactions",
      description: "Transaction operations",
      endpoints: [
        {
          path: "/transactions",
          method: "GET",
          description: "Get all transactions",
        },
        {
          path: "/transactions/{id}",
          method: "GET",
          description: "Get transaction by ID",
        },
        {
          path: "/transactions",
          method: "POST",
          description: "Create new transaction",
        },
        {
          path: "/transactions/{id}",
          method: "PUT",
          description: "Update transaction",
        },
        {
          path: "/transactions/{id}",
          method: "DELETE",
          description: "Delete transaction",
        },
      ],
    },
    {
      name: "Reports",
      description: "Reporting and analytics",
      endpoints: [
        {
          path: "/reports/monthly",
          method: "GET",
          description: "Get monthly report",
        },
        {
          path: "/reports/daily",
          method: "GET",
          description: "Get daily report",
        },
        {
          path: "/reports/sales-performance",
          method: "GET",
          description: "Get sales performance report",
        },
        {
          path: "/reports/product-sales",
          method: "GET",
          description: "Get product sales report",
        },
        {
          path: "/reports/customer-transactions",
          method: "GET",
          description: "Get customer transactions report",
        },
        {
          path: "/reports/income-expense",
          method: "GET",
          description: "Get income/expense report",
        },
        {
          path: "/reports/export/excel",
          method: "GET",
          description: "Export report to Excel",
        },
        {
          path: "/reports/export/pdf",
          method: "GET",
          description: "Export report to PDF",
        },
      ],
    },
    {
      name: "Dashboard",
      description: "Dashboard metrics",
      endpoints: [
        {
          path: "/dashboard/summary",
          method: "GET",
          description: "Get dashboard summary",
        },
        {
          path: "/dashboard/recent-transactions",
          method: "GET",
          description: "Get recent transactions",
        },
        {
          path: "/dashboard/top-products",
          method: "GET",
          description: "Get top products",
        },
        {
          path: "/dashboard/top-customers",
          method: "GET",
          description: "Get top customers",
        },
        {
          path: "/dashboard/sales-chart",
          method: "GET",
          description: "Get sales chart data",
        },
        {
          path: "/dashboard/income-expense-chart",
          method: "GET",
          description: "Get income/expense chart data",
        },
      ],
    },
    {
      name: "Classes",
      description: "Class management",
      endpoints: [
        { path: "/classes", method: "GET", description: "Get all classes" },
        { path: "/classes", method: "POST", description: "Create new class" },
        { path: "/classes/{id}", method: "PUT", description: "Update class" },
        {
          path: "/classes/{id}",
          method: "DELETE",
          description: "Delete class",
        },
      ],
    },
    {
      name: "Programs",
      description: "Study program management",
      endpoints: [
        {
          path: "/progdis",
          method: "GET",
          description: "Get all study programs",
        },
        {
          path: "/progdis",
          method: "POST",
          description: "Create new study program",
        },
        {
          path: "/progdis/{id}",
          method: "PUT",
          description: "Update study program",
        },
        {
          path: "/progdis/{id}",
          method: "DELETE",
          description: "Delete study program",
        },
      ],
    },
  ],
  security: [{ bearerAuth: [] }],
};

const outputFile = "./swagger_output.json";
const endpointsFiles = ["../routes/*.js"];

swaggerAutogen(outputFile, endpointsFiles, doc);
