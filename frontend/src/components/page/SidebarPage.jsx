/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const SidebarPage = () => {
  const [orgData, setOrgData] = useState(
    useSelector((state) => state.organization.organization)
  );
  const [userData, setUserData] = useState(
    useSelector((state) => state.user.user)
  );
  useEffect(() => {
    if (userData === null) {
      setUserData(JSON.parse(localStorage.getItem("user")));
    }
    if (orgData === null) {
      setOrgData(JSON.parse(localStorage.getItem("organization")));
    }
  }, []);
  return (
    <>
      <div className="">
        {orgData && userData && (
          <div className="flex flex-col md:flex-row">
            <div>
              {orgData.logo && (
                <img
                  src={orgData.logo}
                  alt="organization logo"
                  className="w-20 h-20 rounded-full"
                />
              )}
            </div>
            <div>
              <h1 className="text-2xl">{orgData.name}</h1>
              <p>{userData.username}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SidebarPage;
