import { RouterProvider } from 'react-router-dom';
import '../App.css'
import { router } from './router';
import { Toaster } from 'sonner';

function App() {
  return <>
    <RouterProvider router={router} />

    <Toaster
      position="bottom-right"
      richColors
      closeButton
      expand={true}
      visibleToasts={4}
      toastOptions={
        { duration: 3000 }
      }
    />
  </>;
}

    export default App
