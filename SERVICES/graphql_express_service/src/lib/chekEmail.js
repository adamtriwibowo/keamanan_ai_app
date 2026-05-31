const axios = require("axios");
const checkEmail = async (emails) => {
  try {
    console.log(emails);
    const datas = [];

    emails.map(async (email) => {
      console.log(email);
      const { data } = await axios.get(
        `https://leakcheck.io/api/public?check=${email}`
      );
      console.log(data);
    });
    return datas;
  } catch (error) {
    console.error("Error checking email:", error);
    throw error;
  }
};



const main = async () => {
    const data = await checkEmail(["z2yC3@example.com", "z2yC3@example.com"]);
    console.log(data);
}

main();
module.exports = { checkEmail };
