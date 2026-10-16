import { useCallback, useEffect, useState } from 'react'
import {
  Authenticator,
  Button,
  Divider,
  Flex,
  Grid,
  Heading,
  Text,
  TextField,
  View,
} from '@aws-amplify/ui-react'
import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/data'
import outputs from '../amplify_outputs.json'

import '@aws-amplify/ui-react/styles.css'
import './App.css'

Amplify.configure(outputs)

const client = generateClient({ authMode: 'userPool' })

function NotesApp({ signOut }) {
  const [notes, setNotes] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const loadNotes = useCallback(async () => {
    const { data, errors } = await client.models.Note.list()
    if (errors?.length) {
      throw new Error(errors.map(({ message }) => message).join(', '))
    }
    return data
  }, [])

  useEffect(() => {
    let isActive = true

    loadNotes()
      .then((loadedNotes) => {
        if (isActive) {
          setNotes(loadedNotes)
        }
      })
      .catch((loadError) => {
        console.error('Unable to load notes', loadError)
        if (isActive) {
          setError('Could not load your notes. Please try again.')
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [loadNotes])

  async function createNote(event) {
    event.preventDefault()
    setError('')
    setIsSaving(true)

    const form = new FormData(event.currentTarget)
    const formElement = event.currentTarget

    try {
      const { errors } = await client.models.Note.create({
        name: form.get('name'),
        description: form.get('description'),
      })
      if (errors?.length) {
        throw new Error(errors.map(({ message }) => message).join(', '))
      }

      formElement.reset()
      setNotes(await loadNotes())
    } catch (createError) {
      console.error('Unable to create note', createError)
      setError('Could not save your note. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteNote(id) {
    setError('')

    try {
      const { errors } = await client.models.Note.delete({ id })
      if (errors?.length) {
        throw new Error(errors.map(({ message }) => message).join(', '))
      }
      setNotes(await loadNotes())
    } catch (deleteError) {
      console.error('Unable to delete note', deleteError)
      setError('Could not delete that note. Please try again.')
    }
  }

  return (
    <Flex
      className="App"
      direction="column"
      gap="1.5rem"
      width="min(900px, 92%)"
      margin="2rem auto"
    >
      <Flex justifyContent="space-between" alignItems="center">
        <Heading level={1}>My Notes</Heading>
        <Button onClick={signOut}>Sign out</Button>
      </Flex>

      <View as="form" onSubmit={createNote}>
        <Flex direction="column" gap="1rem">
          <TextField
            name="name"
            label="Note title"
            placeholder="Note title"
            isRequired
          />
          <TextField
            name="description"
            label="Note"
            placeholder="Write a note..."
            isRequired
          />
          <Button type="submit" variation="primary" isLoading={isSaving}>
            Add note
          </Button>
        </Flex>
      </View>

      {error && <Text role="alert">{error}</Text>}
      <Divider />
      <Heading level={2}>Your notes</Heading>

      {isLoading ? (
        <Text>Loading notes...</Text>
      ) : notes.length === 0 ? (
        <Text>No notes yet. Add one above to get started.</Text>
      ) : (
        <Grid
          templateColumns="repeat(auto-fit, minmax(240px, 1fr))"
          gap="1rem"
        >
          {notes.map((note) => (
            <Flex
              key={note.id}
              direction="column"
              gap="0.75rem"
              border="1px solid #ccc"
              padding="1.25rem"
              borderRadius="0.5rem"
            >
              <Heading level={3}>{note.name}</Heading>
              <Text>{note.description}</Text>
              <Button
                variation="destructive"
                onClick={() => deleteNote(note.id)}
              >
                Delete
              </Button>
            </Flex>
          ))}
        </Grid>
      )}
    </Flex>
  )
}

function App() {
  return (
    <Authenticator>
      {({ signOut }) => <NotesApp signOut={signOut} />}
    </Authenticator>
  )
}

export default App
