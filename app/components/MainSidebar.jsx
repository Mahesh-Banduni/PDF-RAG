"use client";

import { useState } from "react";
import Image from "next/image";
import { Sidebar as SidebarIcon, Edit } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function MainSidebar({
  isMdDown,
  sidebarOpen,
  setSidebarOpen,
  chatChannels,
  renderChannelItem,
  user,
  loadingChannels
}) {
  const router = useRouter();

  const SidebarContent = (
    <>
      {/* Header */}
      <div className="flex justify-between items-center p-4">
        <div className="w-10 h-7 relative">
          <Image
            src="/images/Logo.png"
            alt="Logo"
            fill
            style={{ objectFit: "cover", objectPosition: "top" }}
            priority
          />
        </div>

        <button
          onClick={() => setSidebarOpen(false)}
          className="cursor-pointer p-2 hover:bg-slate-600 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <SidebarIcon className="w-5 h-5" />
        </button>
      </div>

      {/* New Chat */}
      <div className="p-1.5">
        <button
          onClick={() => router.replace(`/`)}
          className="cursor-pointer w-full flex items-center gap-3 px-3 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
        >
          <Edit className="w-5 h-5" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Chats */}
      <h2 className="px-5 pt-4 pb-1 text-lg font-bold">Chats</h2>
      <div className="flex-1 overflow-y-auto p-2 text-sm space-y-2">
        {loadingChannels ? (
          <div className="w-full flex items-center justify-center h-full">
            <h1 className="p-4">Loading chats...</h1>
          </div>
        ) : chatChannels?.length === 0 && !loadingChannels ? (
          <div className="w-full flex items-center justify-center h-full">
            <h1 className="p-4">No chats found</h1>
          </div>
        ) : (
          chatChannels.map((chatChannel) => renderChannelItem(chatChannel))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700 space-y-2">
        <nav className="flex items-center gap-4">
          <SignedIn>
            <div className="flex items-center gap-3">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-8 h-8",
                  },
                }}
              />

              {user && (
                <div className="flex flex-col">
                  <div className="text-white text-sm font-medium">
                    {user.firstName
                      ? `${user.firstName} ${user.lastName || ""}`
                      : user.username || user.emailAddresses?.[0]?.emailAddress}
                  </div>
                  <div className="text-white text-xs font-medium">
                    {user.emailAddresses?.[0]?.emailAddress}
                  </div>
                </div>
              )}
            </div>
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal" redirectUrl="/">
              <button className="cursor-pointer px-4 py-1 border border-white rounded-lg text-sm hover:bg-white hover:text-black transition">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </nav>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Drawer */}
      {isMdDown ? (
        sidebarOpen && (
          <div className="fixed inset-0 z-[99] flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-md"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar modal"
            />

            {/* Drawer */}
            <div className="relative w-72 max-w-[100vw] h-full bg-slate-900 text-white flex flex-col overflow-y-auto transition-all duration-300 z-[100] shadow-2xl">
              {SidebarContent}
            </div>
          </div>
        )
      ) : (
        /* Desktop Sidebar */
        <div
          className={`${sidebarOpen ? "w-72" : "w-0"} transition-all duration-300 bg-slate-900 text-white flex flex-col overflow-hidden`}
        >
          {SidebarContent}
        </div>
      )}
    </>
  );
}
