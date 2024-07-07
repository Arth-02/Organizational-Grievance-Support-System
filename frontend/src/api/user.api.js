import axios from 'axios';

export const login = async (email, password) => {
    const response = await axios.post("/users/login", {
      email,
      password,
    });
    return response;
};
