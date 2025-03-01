import { useContext } from "react";
import AuthContext from "../context/AuthProvider";

const useAuth = () => {
  const contextValue = useContext(AuthContext);
  return {contextValue};
}

export default useAuth;
