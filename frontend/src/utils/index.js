// function to save into local storage
export const saveToLocalStorage = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    }
    catch (error) {
        console.log(error);
    }
};

// function to get from local storage
export const getFromLocalStorage = (key) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    }
    catch (error) {
        console.log(error);
        return null;
    }
};

// function to remove from local storage
export const removeFromLocalStorage = (key) => {
    try {
        localStorage.removeItem(key);
    }
    catch (error) {
        console.log(error);
    }
};

// function to clear local storage
export const clearLocalStorage = () => {
    try {
        localStorage.clear();
    }
    catch (error) {
        console.log(error);
    }
};
