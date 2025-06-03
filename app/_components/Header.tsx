import Image from "next/image";
import React from "react";
import { Button } from "@/components/ui/button";

const Header = () => {
  const user = false; // TODO: Replace with your auth solution
  return (
    <header className="z-10 backdrop-blur-xl w-full fixed">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center gap-8 px-4 sm:px-6 lg:px-8">
        <a className="flex gap-2" href="#">
          <Image src={"./logo.svg"} alt="Eraser.io" width={30} height={30} />
          <p className="text-white font-semibold">eraser</p>
        </a>

        <div className="flex flex-1 items-center justify-end md:justify-between">
          <nav aria-label="Global" className="hidden md:block">
            <ul className="flex items-center gap-6 text-sm">
              <li>
                <a
                  className="text-white transition hover:text-white/75"
                  href="#"
                >
                  {" "}
                  About{" "}
                </a>
              </li>

              <li>
                <a
                  className="text-white transition hover:text-white/75"
                  href="#"
                >
                  {" "}
                  Careers{" "}
                </a>
              </li>

              <li>
                <a
                  className="text-white transition hover:text-white/75"
                  href="#"
                >
                  {" "}
                  History{" "}
                </a>
              </li>

              <li>
                <a
                  className="text-white transition hover:text-white/75"
                  href="#"
                >
                  {" "}
                  Services{" "}
                </a>
              </li>

              <li>
                <a
                  className="text-white transition hover:text-white/75"
                  href="#"
                >
                  {" "}
                  Projects{" "}
                </a>
              </li>
            </ul>
          </nav>

          <div className="flex items-center gap-4">
            <div className="sm:flex sm:gap-4">              {user ? (
                <Button>
                  <a href="/dashboard">Go to Dashboard</a>
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="hover:bg-blue-500">
                    <a href="/login">Login</a>
                  </Button>
                  <Button variant="outline" className="hidden md:block hover:bg-gray-700">
                    <a href="/register">Register</a>
                  </Button>
                </>
              )}
            </div>

            <button className="block rounded bg-gray-100 p-2.5 text-black transition hover:text-gray-500/75 md:hidden">
              <span className="sr-only">Toggle menu</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
