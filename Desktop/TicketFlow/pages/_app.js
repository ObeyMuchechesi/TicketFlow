import Layout from '../components/Layout';

export default function App({ Component, pageProps }) {
  // Pages can export getLayout to override the default layout
  const getLayout = Component.getLayout || ((page) => <Layout>{page}</Layout>);
  return getLayout(<Component {...pageProps} />);
}
