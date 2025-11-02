import B2 from "backblaze-b2";

const b2 = new B2({
  applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY,
});

export async function POST(req) {
  try {
    const { fileName} = await req.json(); // 7 days default

    if (!fileName) {
      return Response.json({ error: "fileName is required" }, { status: 400 });
    }

    await b2.authorize();

    const { data: { authorizationToken } } = await b2.getDownloadAuthorization({
      bucketId: process.env.B2_BUCKET_ID,
      fileNamePrefix: fileName,
      validDurationInSeconds: 604800,
    });

    const signedUrl = `https://f005.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${fileName}?Authorization=${authorizationToken}`;

    return Response.json({ signedUrl });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
