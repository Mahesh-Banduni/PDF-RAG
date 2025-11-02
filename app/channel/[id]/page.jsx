import HomePage from "../../components/Homepage";

export default async function ChannelPage({ params }) {
  const { id } = await params;

  return <HomePage chatChannelId={id} />;
}
