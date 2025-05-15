# WebCodecs API Demo

This project demonstrates the use of the WebCodecs API in a React + TypeScript + Vite application. The WebCodecs API provides low-level access to media encoders and decoders, allowing for more efficient and flexible media processing in web applications.

## Features

- **Video Capture**: Captures video from your webcam using the MediaDevices API
- **Video Encoding**: Encodes raw video frames using the WebCodecs VideoEncoder
- **Video Decoding**: Decodes the encoded data back to frames using the WebCodecs VideoDecoder
- **Side-by-Side Display**: Shows both the original input and the decoded output
- **Performance Metrics**: Displays the number of encoded and decoded frames

## Browser Compatibility

The WebCodecs API is relatively new and may not be supported in all browsers. This demo works best in:

- Chrome 94 or later
- Edge 94 or later
- Opera 80 or later

## How to Use

1. Clone this repository
2. Install dependencies with `npm install`
3. Run the development server with `npm run dev`
4. Open your browser to the local development URL
5. Click "Start Recording" to begin the demo
6. Allow camera access when prompted
7. Observe the encoding and decoding process in real-time

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
