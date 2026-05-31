const axios = require('axios');

const checkEmail = async (email) => {
    try {
        const response = await axios.get(`https://leakcheck.io/api/public?check=${email}`);
        return response.data;
    } catch (error) {
        console.error('Error checking email:', error);
        throw error;
    }
}

module.exports = {
    checkEmail
}