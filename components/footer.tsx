"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { signOut } from "./actions";
import { GrStatusPlaceholder } from "react-icons/gr";

const Footer = () => {
  const handleSignOut = async () => {
    const error = await signOut();
  };

  const logInGoogle = async (e: React.FormEvent) => {
    e.preventDefault();

    const supabase = createClientComponentClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`,
      },
    });
  };

  return (
    <footer className="flex h-40 items-center justify-center gap-48 bg-emerald-900 text-sm text-zinc-200">
      <div className="flex flex-col">
        <Link href={"/"}>The Kabsu Shop</Link>
        <Link href={"/about"}>About us</Link>
        <Link href={"/contact"}>Contact us</Link>
      </div>
      <div className="flex flex-col">
        <Link href={"/help"}>Help Center</Link>
        <Link href={"/privacy"}>Privacy Policy</Link>
        <Link href={"/terms"}>Terms of Service</Link>
      </div>
      <div className="flex flex-col items-start">
        <button type="submit" onClick={logInGoogle}>
          Sign In
        </button>
        <button onClick={() => signOut}>Sign Out</button>
        <Link href={"/profile"}>My Account</Link>
      </div>
    </footer>
  );
};

export default Footer;
