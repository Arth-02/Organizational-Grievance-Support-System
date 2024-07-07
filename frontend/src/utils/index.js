// Function to delete token from local storage
export const deleteToken = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
};

// Function to get token from local storage
export const getToken = () => {
  return localStorage.getItem("token");
};

// Function to set token to local storage
export const setToken = (token, role) => {
    localStorage.setItem("token", token)
    localStorage.setItem("role", role)
}

// Function to check if user is admin
export const isAdmin = () => {
  return localStorage.getItem("role") === "admin";
};  

// Function to check if user is logged in
export const isLoggedIn = () => {
  return !!localStorage.getItem("token");
};

// Function to get user role
export const getUserRole = () => {
  return localStorage.getItem("role");
};

// Function to logout user
export const logout = () => {
  deleteToken();
  window.location.reload();
};