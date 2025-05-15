import "./App.css";
import { WebCodecsDemo } from "./components/WebCodecsDemo";

function App() {
  return (
    <>
      <h1>WebCodecs API Demo</h1>
      <p className="description">
        This demo shows how to use the WebCodecs API to encode and decode video frames. The left video shows the input
        from your camera, and the right shows the decoded output after encoding.
      </p>
      <WebCodecsDemo />
    </>
  );
}

export default App;
