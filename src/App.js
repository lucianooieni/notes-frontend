import React, { useState, useEffect, useRef } from 'react'
import noteService from './services/notes'
import loginService from './services/login'
import Note from './components/Note'
import Footer from './components/Footer'
import Notification from './components/Notification'
import LoginForm from './components/LoginForm'
import Togglable from './components/Toggable'
import NoteForm from './components/NoteForm'
import propTypes from 'prop-types'

const App = () => {
  const noteFormRef = useRef()
  const [notes, setNotes] = useState([])
  const [showAll, setShowAll] = useState(true)
  const [errorMessage, setErrorMessage] = useState('some error happened...')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)
  const [loginVisible, setLoginVisible] = useState(false)


  useEffect(() => {
    console.log('effect')
    noteService
      .getAll()
      .then(initialNotes => {
        console.log('promise fulfilled')
        setNotes(initialNotes)
      })
  }, [])

  useEffect(() => {
    const loggedUserJSON = window.localStorage.getItem('loggedNoteappUser')
    if(loggedUserJSON) {
      const user = JSON.parse(loggedUserJSON)
      setUser(user)
      noteService.setToken(user.token)
    }
  }, [])

  const handleLogin = async (event) => {
    event.preventDefault()

    try {
      const user = await loginService.login({username, password})
      window.localStorage.setItem(        
        'loggedNoteappUser', JSON.stringify(user)      
      ) 
      noteService.setToken(user.token)
      setUser(user)
      setUsername('')
      setPassword('')
    } catch (exception) {
      setErrorMessage('Wrong credentials')      
      setTimeout(() => {        
        setErrorMessage(null)      
      }, 5000)
    }
  }

  const toggleImportanceOf = (id) => {    
    console.log('importance of ' + id + ' needs to be toggled')
    const note = notes.find(n => n.id === id)
    const changedNote = {...note, important: !note.important}
    noteService
      .update(id, changedNote)
      .then(returnedNote => {
        setNotes(notes.map(note => note.id !== id ? note : returnedNote))
      })
      .catch(error => {    
        console.log(error)  
        setErrorMessage(          
          `Note '${note.content}' was already removed from server`        
        )        
        setTimeout(() => {          
          setErrorMessage(null)        
        }, 5000)   

        setNotes(notes.filter(n => n.id !== id))    
      })
    
  }

  const addNote = (noteObject) => {
    noteFormRef.current.toggleVisibility()
    noteService
      .create(noteObject)
      .then(returnedNote => {
        setNotes([...notes, returnedNote])
      })
      .catch(error => {
        console.log(error)
      })
  }

  const notesToShow = showAll
    ? notes
    : notes.filter(note => note.important === true)

    const loginForm = () => {
      const hideWhenVisible = { display: loginVisible ? 'none' : '' }
      const showWhenVisible = { display: loginVisible ? '' : 'none' }
  
      return (
        <Togglable buttonLabel='login'>
          <LoginForm
            username={username}
            password={password}
            handleUsernameChange={({ target }) => setUsername(target.value)}
            handlePasswordChange={({ target }) => setPassword(target.value)}
            handleSubmit={handleLogin}
          />
        </Togglable>
      )
    }

  const noteForm = () => (
    <Togglable buttonLabel="new note" ref={noteFormRef}>
      <NoteForm
        createNote={addNote}
      />
    </Togglable>
  )

  return (
    <div>
      <h1>Notes</h1>
      <Notification message={errorMessage} />
      {
        user === null ?
          loginForm() :
          <div>
            <p>{user.username} logged-in</p>
            {noteForm()}
          </div>        
      }
      <div>
        <button onClick={() => setShowAll(!showAll)}>
          show {showAll ? 'important' : 'all'}
        </button>
      </div>
      <ul>
        {notesToShow
          .map(note =>
            <Note 
              key={note.id} 
              note={note}
              toggleImportance={()=> toggleImportanceOf(note.id)} 
            />
          )}
      </ul>
      <Footer />
    </div>
  )
}

export default App
