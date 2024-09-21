"use client";

import { Bounce, ToastContainer, toast } from "react-toastify";
import { createContext, useContext } from "react";
import "react-toastify/dist/ReactToastify.css";

type ToastContext = {
  toast: typeof toast;
};

interface ToastContextInterface {
  children: React.ReactNode;
}

const ToastContext = createContext({} as ToastContext);

const ToastContextProvider = ({ children }: ToastContextInterface) => {
  return (
    <ToastContext.Provider value={{ toast }}>
      <>
        {children}
        <ToastContainer
          position={"bottom-center"}
          autoClose={8000}
          theme={"dark"}
          limit={1}
          transition={Bounce}
          className={"md:w-96 mb-26"}
          progressClassName={
            "bg-gradient-to-r bg-gradient to-[#13EF93]/50 from-[#149AFB]/80"
          }
        />
      </>
    </ToastContext.Provider>
  );
};

function useToast() {
  return useContext(ToastContext);
}

export { ToastContextProvider, useToast };
