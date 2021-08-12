import React, {useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import { API, AWSKinesisFirehoseProvider, Storage } from 'aws-amplify';
// import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { listNotes } from './graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation } from './graphql/mutations';
import S3FileUpload from 'react-s3';


const initialFormState = { name: '', description: '' }

function App() {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  
  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(notesFromAPI.map(async note => {
      if (note.image) {
        const image = await Storage.get(note.image);
        note.image = image;
      }
      return note;
    }))
    setNotes(apiData.data.listNotes.items);
  }

  async function createNote() {
    if (!formData.name || !formData.description) return;
    await API.graphql({ query: createNoteMutation, variables: { input: formData } });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setNotes([ ...notes, formData ]);
    setFormData(initialFormState);
  }
  

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter(note => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});
  }

  async function onChange(e) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchNotes();
  }

//   const config = {
//     bucketName: 'myBucket',
//     dirName: 'photos', /* optional */
//     region: 'us-ease-1',
//     accessKeyId: aws.accessKeyId,
//     secretAccessKey: aws.secretAccessKey,
// }
 
// /*  Notice that if you don't provide a dirName, the file will be automatically uploaded to the root of your bucket */
 
 

  return (
    <div className="App">
        <img src={logo} className="App-logo" alt="logo" />
        <h2> Up and Running! </h2>
        <h3> and now including Auth! </h3>
      
        <input
        onChange={e => setFormData({ ...formData, 'name': e.target.value})}
        placeholder="Note name"
        value={formData.name}
          />
      <input
        onChange={e => setFormData({ ...formData, 'description': e.target.value})}
        placeholder="Note description"
        value={formData.description}
          />
          <input
             type="file"
              onChange={onChange}
            />

      <button onClick={createNote}>Create Pace Goal</button>
      <div style={{marginBottom: 30}}>
      {
          notes.map(note => (
            <div key={note.id || note.name}>
              <h2>{note.name}</h2>
              <p>{note.description}</p>
              <button onClick={() => deleteNote(note)}>Delete note</button>
              {
                note.image && <img alt="uploaded" src={note.image} style={{width: 400}} />
              }
            </div>
          ))
        }
      </div>

      <h3>S3 Upload</h3>



      {/* <AmplifySignOut /> */}
    </div>
  );
}

export default App;

// export default withAuthenticator (App);
