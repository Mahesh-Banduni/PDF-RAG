import HomePage from './components/Homepage';

export default function Dashboard({chatChannelId}) {
  return (
    <HomePage chatChannelId={chatChannelId} />
  );
}
