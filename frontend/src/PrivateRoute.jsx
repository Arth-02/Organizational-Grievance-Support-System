import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getFromLocalStorage } from "./utils";
import { useGetProfileQuery } from "./services/auth.service";
import { setUserDetails } from "./features/userSlice";

function PrivateRoute({ children }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = !!useSelector((state) => state.user.user);
  const token = getFromLocalStorage("token");
  const { data: userData, isLoading } = useGetProfileQuery(null, {
    skip: !token, // Skip the query if no token is available
  });

  useEffect(() => {
    if (userData) {
      dispatch(setUserDetails({ data: userData.data }));
    }

    // If no token is found or the user is not authenticated, navigate to login
    if (!token && !isLoading) {
      navigate("/login");
    }
  }, [token, userData, isAuthenticated, isLoading, dispatch, navigate]);

  // If loading the user profile, you can display a loader or a placeholder
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Render the children components if authenticated
  return isAuthenticated ? children : null;
}

export default PrivateRoute;
