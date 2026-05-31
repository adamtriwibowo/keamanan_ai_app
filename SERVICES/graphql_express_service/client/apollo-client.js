const { request, gql } = require('graphql-request');

const endpoint = 'http://localhost:5000/graphql';

// Query
const query = gql`
  query GetBooks {
    books {
      id
      title
      author
    }
  }
`;

// Mutation
const mutation = gql`
  mutation AddBook($title: String!, $author: String!) {
    addBook(title: $title, author: $author) {
      id
      title
    }
  }
`;

// Eksekusi
async function main() {
  try {
    // Query Data
    const data = await request(endpoint, query);
    console.log('Books:', data.books);

    // Mutation
    const result = await request(endpoint, mutation, {
      title: "New Book",
      author: "Author Name"
    });
    console.log('Added book:', result.addBook);
  } catch (error) {
    console.error('GraphQL Error:', error.response?.errors || error.message);
  }
}

main();