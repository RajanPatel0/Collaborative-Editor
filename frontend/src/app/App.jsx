import "./App.css";
import React from 'react'
import { Editor } from "@monaco-editor/react";

import { MonacoBinding } from "y-monaco"
import { useRef, useMemo, useState, useEffect } from "react" //these are React hooks that we will use to create references and memoized values for the Y.Doc and Y.Text instances, so that we can reuse them across renders and avoid unnecessary re-renders and re-connections to the server, and also to ensure that the same Y.Doc instance is used for all providers and bindings, so that they can sync with each other properly
import * as Y from "yjs"
import { SocketIOProvider } from "y-socket.io"
import { editor } from "monaco-editor";

const App = () => {

  const editorRef = useRef(null);   //it is used to store the reference to the Monaco editor instance, so that we can access it later when we create the MonacoBinding, and it is also used to get the editor model, which is needed for the binding, and it is also used to specify the set of editors that should be synced with the Y.Text type
  
  // const [userName, setuserName] = useState(localStorage.getItem("userName") || "")  //it is used to store the user name state variable, which is used to identify the user in the editor and in the awareness features, and it is also used to trigger a re-render of the component when the user name is set, so that we can show the editor and hide the form, and it is initialized with the value from local storage if it exists, so that we can persist the user name across page reloads and sessions;   
  //Or
  // const [userName, setuserName] = useState(window.localStorage.getItem("userName") || "")  //it is used to store the user name state variable, which is used to identify the user in the editor and in the awareness features, and it is also used to trigger a re-render of the component when the user name is set, so that we can show the editor and hide the form, and it is initialized with the value from local storage if it exists, so that we can persist the user name across page reloads and sessions;   
  //Or
  const [userName, setuserName] = useState(()=>{
     return new URLSearchParams(window.location.search).get("userName") || "" //it is used to store the user name state variable, which is used to identify the user in the editor and in the awareness features, and it is also used to trigger a re-render of the component when the user name is set, so that we can show the editor and hide the form, and it is initialized with the value from the URL query parameter if it exists, so that we can persist the user name across page reloads and sessions without relying on local storage, and it also allows us to share the URL with others and they can join the same document with the same user name
  })

  const [users, setUsers] = useState([])  //it is used to store the list of users that are currently connected to the document, and it is used to show the user list in the editor and in the awareness features, and it is also used to trigger a re-render of the component when the user list changes, so that we can update the user list display



  //create a single Y.Doc instance for the whole app, and pass it to all providers and bindings, so that they can sync with each other: it performs better than creating a new Y.Doc instance for each provider and binding, because it reduces the number of updates and conflicts, and it also allows us to use the same Y.Doc instance for different providers and bindings, so that they can sync with each other even if they are created at different times
  const ydoc = useMemo(()=> //useMemo is used to create a memoized value for the Y.Doc instance, so that it is only created once and reused across renders, and it also ensures that the same Y.Doc instance is used for all providers and bindings, so that they can sync with each other properly, and it also helps to prevent memory leaks and unnecessary connections to the server when the component is re-rendered, because if we create a new Y.Doc instance on every render, it will create a new connection to the server and a new document state, which can cause conflicts and performance issues, so by using useMemo, we can ensure that we are reusing the same Y.Doc instance and connection to the server across renders
    new Y.Doc()   //it is used to create a new Y.Doc instance, which is the main data structure that holds the shared data and the state of the document, and it is used by the providers and bindings to sync the data with other clients, and it also provides features like transactions, awareness, and undo/redo, so it is important to create it only once and reuse it throughout the app to ensure that all providers and bindings are syncing with the same document and state
  , [])

  //for monaco binding, the text type should be created before the provider: it is used to select single text type for the editor, and the provider will sync the whole document, so if the text type is created after the provider, it will not be synced to other clients
  const yText = useMemo(()=>  //it is important to create the Y.Text type before the provider, because the provider will sync the whole document, so if the Y.Text type is created after the provider, it will not be synced to other clients, and it will not be available for the MonacoBinding to bind to, so we need to create it before the provider to ensure that it is synced and available for binding
    ydoc.getText("monaco")  //it is used to create a Y.Text type with the name "monaco", and it is used by the MonacoBinding to sync the content of the editor with this Y.Text type, so that any changes made in the editor will be reflected in this Y.Text type, and any changes made in this Y.Text type (either by this client or by other clients) will be reflected in the editor
  , [ydoc])

  const handleMount = (editor)=>{
    editorRef.current = editor;   //it is used to store the reference to the Monaco editor instance, so that we can access it later when we create the MonacoBinding, and it is also used to get the editor model, which is needed for the binding, and it is also used to specify the set of editors that should be synced with the Y.Text type

    //this line is used to bind the Monaco editor to the Y.Text type, so that any changes made in the editor will be reflected in the Y.Text type, and any changes made in the Y.Text type (either by this client or by other clients) will be reflected in the editor: it creates a new MonacoBinding instance, which takes the Y.Text type, the Monaco editor model, a set of Monaco editors (in this case, just one), and the provider awareness (which is used to track the presence of other clients)
      const monacoBinding = new MonacoBinding(  //here we are creating a new MonacoBinding instance, which is used to bind the Monaco editor to the Y.Text type, so that any changes made in the editor will be reflected in the Y.Text type, and any changes made in the Y.Text type (either by this client or by other clients) will be reflected in the editor
        yText,  //it is used to specify the Y.Text type that we want to bind to the Monaco editor, and it is used by the MonacoBinding to sync the content of the editor with the Y.Text type, so that any changes made in the editor will be reflected in the Y.Text type, and any changes made in the Y.Text type (either by this client or by other clients) will be reflected in the editor
        editorRef.current.getModel(), //it is used to get the Monaco editor model, which is the data structure that represents the content of the editor, and it is used by the MonacoBinding to sync the content of the editor with the Y.Text type
        new Set([editorRef.current]),   //it is used to specify the set of Monaco editors that should be synced with the Y.Text type, and in this case, we are only syncing one editor, so we create a new Set with just that editor, but if we had multiple editors that we wanted to sync with the same Y.Text type, we could add them to the Set as well
      )
  }

  const handleConnect=(e)=>{
    e.preventDefault()
    setuserName(e.target.userName.value)   //it is used to set the user name state variable to the value entered in the input field, so that we can use it later to identify the user in the editor and in the awareness features, and it is also used to trigger a re-render of the component, so that we can show the editor and hide the form when the user name is set
    // localStorage.setItem("userName", e.target.userName.value)  //it is used to store the user name in the local storage, so that we can persist the user name across page reloads and sessions, and it also allows us to retrieve the user name later when we need it, for example, to show the user name in the editor or in the awareness features
    //Or
    // window.localStorage.setItem("userName", e.target.userName.value)  //window.localStorage is the same as localStorage, but it is more explicit and it makes it clear that we are using the local storage of the browser, and it also allows us to access the local storage from different contexts, for example, if we are running the code in a web worker or in an iframe, we can still access the local storage of the main window using window.localStorage
    //Or
    window.history.pushState({}, "", "?userName="+e.target.userName.value)  //it is used to update the URL with the user name as a query parameter, so that we can share the URL with others and they can join the same document with the same user name, and it also allows us to retrieve the user name from the URL when we need it, for example, to show the user name in the editor or in the awareness features, and it also helps to avoid issues with local storage when multiple users are using the same browser or device, because each user can have their own user name in the URL without interfering with each other
  }

  useEffect(()=>{ //it is having code which perform yjs connection, socketio connction and monaco binding, so that it will run when the component is mounted, and it will also clean up the connections and bindings when the component is unmounted, to prevent memory leaks and unnecessary connections when the component is not in use
    console.log(userName)
    
    if(userName){  //it is used to check if the user name is set and the editor reference is available before creating the connections and bindings, because we need both of them to create the provider and the MonacoBinding, and we want to make sure that we only create them when we have the necessary information and resources, to avoid errors and unnecessary connections when the component is not fully ready
      //this line is used to connect to the server and sync the document with other clients: it creates a new SocketIOProvider instance, which connects to the server at the specified URL, and syncs the document with other clients that are connected to the same room (in this case, "monaco"), and it also enables autoConnect, so that it will automatically connect to the server when the component is mounted, and disconnect when the component is unmounted
      const provider = new SocketIOProvider("/", "monaco", ydoc,{
        autoConnect: true,  //it is used to automatically connect to the server when the component is mounted, and disconnect when the component is unmounted, so that we don't have to manually connect and disconnect, and it also helps to prevent memory leaks and unnecessary connections when the component is not in use
      })

      provider.awareness.setLocalStateField("user", {  //it is used to set the local state field for the user in the provider awareness, so that we can identify the user in the editor and in the awareness features, and it is also used to trigger a re-render of the component when the user state changes, so that we can update the user list display and other awareness features, and it is important to set this field after creating the provider, because it is used by the provider to track the presence of other clients and to show their cursors and selections in the editor
        userName, //it is used to set the user name in the local state field for the user in the provider awareness, so that we can identify the user in the editor and in the awareness features, and it is also used to trigger a re-render of the component when the user state changes, so that we can update the user list display and other awareness features, and it is important to set this field after creating the provider, because it is used by the provider to track the presence of other clients and to show their cursors and selections in the editor
      })

      //this block of code is used to initialize the user list with the current presence information of other clients when we first connect to the server, so that we can show the user list display and other awareness features with the correct information from the start, and it is also used to trigger a re-render of the component when the user list changes, so that we can update the user list display and other awareness features with the current presence information of other clients when we first connect to the server, and it is important to do this after creating the provider, because it allows us to get the current states of all clients from the provider awareness, which is necessary to extract the user information and update the user list state variable accordingly
      const states = Array.from(provider.awareness.getStates().values())  //it is used to get the current states of all clients from the provider awareness, and it is used to extract the user information from the states, so that we can update the user list display and other awareness features, and it is important to do this after creating the provider, because it allows us to initialize the user list with the current presence information of other clients when we first connect to the server
      console.log(states)
      setUsers(states.filter(state => state.user && state.user.userName).map(state=>state.user))  //it is used to update the user list state variable with the user information extracted from the provider awareness states, and it is used to trigger a re-render of the component when the user list changes, so that we can update the user list display and other awareness features, and it is important to do this after creating the provider, because it allows us to initialize the user list with the current presence information of other clients when we first connect to the server

      //this one is for subsequent changes in the presence of other clients, so that we can update the user list display and other awareness features when the presence of other clients changes, and it is also used to trigger a re-render of the component when the user list changes, so that we can update the user list display and other awareness features when the presence of other clients changes, and it is important to listen for this event after creating the provider, because it is emitted by the provider when the presence of other clients changes, and it allows us to keep track of the users that are currently connected to the document
      provider.awareness.on("change", ()=>{ //it is used to listen for changes in the provider awareness, so that we can update the user list display and other awareness features when the presence of other clients changes, and it is also used to trigger a re-render of the component when the user list changes, so that we can update the user list display and other awareness features, and it is important to listen for this event after creating the provider, because it is emitted by the provider when the presence of other clients changes, and it allows us to keep track of the users that are currently connected to the document
        const states = Array.from(provider.awareness.getStates().values()) //it is used to get the current states of all clients from the provider awareness, and it is used to extract the user information from the states, so that we can update the user list display and other awareness features, and it is important to do this when the "change" event is emitted by the provider, because it indicates that the presence of other clients has changed, and we need to update our user list accordingly
        setUsers(states.filter(state => state.user && state.user.userName).map(state=>state.user))  //it is used to update the user list state variable with the user information extracted from the provider awareness states, and it is used to trigger a re-render of the component when the user list changes, so that we can updatethe user list display and other awareness features, and it is important to do this whenthe "change" event is emitted bythe provider, because it indicates thatthe presence of other clients has changed, and we need to update our user list accordingly

      })

      function handleBeforeUnload(){  //it is used to handle the beforeunload event of the window, so that we can disconnect from the provider and clean up the connections and bindings when the user leaves the page or closes the tab, to prevent memory leaks and unnecessary connections when the component is not in use, and it is important to add this event listener after creating the provider, because it allows us to properly clean up the provider connection when the user leaves the page 
        provider.awareness.setLocalStateField("user", null)  //it is used to clear the local state field for the user in the provider awareness, so that we can indicate that the user has left the document, and it is also used to trigger a re-render of the component when the user state changes, so that we can update the user list display and other awareness features, and it is important to do this before disconnecting from the provider, because it allows us to properly update the presence information for other clients before we disconnect
      }

      window.addEventListener("beforeunload", handleBeforeUnload)  //it is used to add the event listener for the beforeunload event of the window, so that we can handle the cleanup of the provider connection when the user leaves the page or closes the tab, to prevent memory leaks and unnecessary connections when the component is not in use, and it is important to add this event listener after creating the provider, because it allows us to properly clean up the provider connection when the user leaves the page

      return ()=>{
        provider.disconnect()  //it is used to disconnect from the provider when the component is unmounted, to prevent memory leaks and unnecessary connections when the component is not in use, and it is important to do this in the cleanup function of the useEffect hook, because it ensures that we properly clean up the provider connection when the component is unmounted
        window.removeEventListener("beforeunload", handleBeforeUnload)  //it is used to remove the event listener for the beforeunload event of the window when the component is unmounted, to prevent memory leaks and unnecessary connections when the component is not in use, and it is important to do this in the cleanup function of the useEffect hook, because it ensures that we properly clean up the event listener when the component is unmounted
      }
      
    }
  }, [
    // editorRef.current,  //it is used to trigger the effect when the editor reference is set, because we need the editor instance to create the MonacoBinding, and we want to make sure that the effect runs after the editor is mounted and the reference is set, so that we can create the binding properly
    userName  //it is used to trigger the effect when the user name is set, because we need the user name to create the provider and to identify the user in the awareness features, and we want to make sure that the effect runs after the user name is set, so that we can create the provider and the binding properly
  ])

  if(!userName){
    return(
      <main className="h-screen w-full bg-gray-950 flex gap-4 p-3 items-center justify-center">
        <form 
          onSubmit={handleConnect}
          className="flex flex-col gap-4">
          <input type="text" 
            placeholder="Enter your name"
            className="p-2 rounder-lg bg-gray-800 text-white"
            name="userName"
          />

          <button 
            className="p-2 rounded-lg bg-amber-50 text-gray-950 font-bold"
          >
            Join
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className='h-screen w-full bg-gray-950 flex gap-4 p-3'>
      <aside className="h-full w-1/4 bg-amber-50 rounded-lg">
        <h2 className="text-gray-950 font-bold text-2xl p-4 border-b border-gray-300">Users</h2>
        <ul className="p-4">
          {users.map((user, index)=>(
            <li key={index} className="text-white bg-gray-800 p-2 rounded-lg mb-2">
              {user.userName} {user.userName === userName && <span className="text-yellow-400 ml-2">(You)</span>}
            </li>
          ))}
        </ul>
      </aside>
      <section className="w-3/4 bg-neutral-800 rounded-lg overflow-hidden">
        <Editor
          height="100%"
          language="javascript"
          theme="vs-dark"
          onMount={handleMount}
          options={{
            minimap: { enabled: false },
            fontSize: 18,
          }}
        />
      
      </section>

    </main>
  )

}

export default App