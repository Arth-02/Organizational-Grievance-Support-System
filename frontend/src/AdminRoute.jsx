import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getFromLocalStorage } from "./utils";
import { useGetProfileQuery } from "./services/auth.service";
import { setUserDetails } from "./features/userSlice";

function AdminRoute({ children }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const role = useSelector((state) => state.user.role);
  const token = getFromLocalStorage("token");
  
  const { data: userData, isLoading } = useGetProfileQuery(null, {
    skip: !token,
  });

  useEffect(() => {
    if (!user && userData) {
      dispatch(setUserDetails({ data: userData.data }));
    }

    // If no token, redirect to login
    if (!token && !isLoading) {
      navigate("/login");
      return;
    }

    // If user is loaded but not DEV, redirect to unauthorized
    if (userData && userData.data?.role?.name !== "DEV") {
      navigate("/unauthorized");
    }
  }, [token, userData, user, isLoading, dispatch, navigate]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user is DEV
  const isDev = role?.name === "DEV" || userData?.data?.role?.name === "DEV";

  return isDev ? children : null;
}

export default AdminRoute;
