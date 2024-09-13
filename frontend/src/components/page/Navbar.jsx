import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useLazyGetOrganizationByIdQuery } from "@/services/api.service";
import { setUserDetails } from "@/features/userSlice";
import { setOrganizationDetails } from "@/features/organizationSlice";
import { saveToLocalStorage } from "@/utils";

const Navbar = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const org = useSelector((state) => state.organization);
  const navigate = useNavigate();
  const [localUser, setLocalUser] = useState(user);
  const [localOrg, setLocalOrg] = useState(org);

  const [triggerGetOrganizationById, { error: orgError }] = useLazyGetOrganizationByIdQuery();

  const fetchUserData = () => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!localUser.user && storedUser) {
      dispatch(setUserDetails(storedUser));
      setLocalUser(storedUser);
    } else if (!storedUser) {
      navigate("/login");
    }
  };

  const fetchOrganizationData = async () => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const storedOrg = JSON.parse(localStorage.getItem("organization"));

    if (!localOrg.organization && storedOrg) {
      dispatch(setOrganizationDetails(storedOrg));
      setLocalOrg(storedOrg);
    }else{
      const result = await triggerGetOrganizationById({
        token: storedUser.token,
        organization_id: storedUser.organization_id,
      }).unwrap();
      if (result) {
        dispatch(setOrganizationDetails(result));
        setLocalOrg(result);
        saveToLocalStorage("organization", result);
      }
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchOrganizationData();
  }, []);

  useEffect(() => {
    if (orgError) {
      console.log(orgError);
    }
  }, [orgError]);

  return (
    <div>
      <h1>Navbar</h1>
    </div>
  );
};

export default Navbar;