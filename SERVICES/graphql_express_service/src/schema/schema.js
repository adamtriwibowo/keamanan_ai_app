const { buildSchema } = require("graphql");

// Define GraphQL schema
exports.typeDefs = buildSchema(`
  
  type LeakItem {
    phone: String!
    email: String!
    status: Int
    leakStatus: Int
    leakLocation: [String]
  }

  type User {
  message: String
  leakEmailUser: String!
  leakItems: [LeakItem]
  leakVerified: Int
  }

type LeakItemResponse {
  message: String
  phone: String
  status: Int
  leakStatus: Int
}

type Email {
  message: String
  phone: String
  email: String!
  status: Int!
}

type Query {
  users: [User]
  user(phone: String!): User
  scanedEmail(phone: String!): [Email]
  getUserLeak(userEmail: String!): [LeakItem]
  }
  
  input UserInput {
    phone: String!
    email: String!
}


type Mutation {
  addLeakItem(userEmail: String!, phone: String! email: String!): Email
  updateStatus(phone: String!, status: Boolean!): User
  deleteUser(phone: String!): Boolean
  updateLeakStatus(
    userEmail: String!,
    phone: [String!]
  ): LeakItemResponse
}
`);
