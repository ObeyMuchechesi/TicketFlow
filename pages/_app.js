import './styles/global.css';
import Layout from '../components/Layout';
import { ToastProvider } from '../components/ui/Toast';

export default function App({ Component, pageProps }) {
  const getLayout = Component.getLayout || ((page) => <Layout>{page}</Layout>);
  return (
    <ToastProvider>
      {getLayout(<Component {...pageProps} />)}
    </ToastProvider>
  );
}

