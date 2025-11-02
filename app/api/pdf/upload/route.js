import B2 from "backblaze-b2";

const b2 = new B2({
  applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY,
});

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    await b2.authorize();

    const buffer = Buffer.from(await file.arrayBuffer());
    const uniqueFileName = `${Date.now()}-${file.name}`;

    const uploadUrlResponse = await b2.getUploadUrl({
      bucketId: process.env.B2_BUCKET_ID,
    });

    await b2.uploadFile({
      uploadUrl: uploadUrlResponse.data.uploadUrl,
      uploadAuthToken: uploadUrlResponse.data.authorizationToken,
      fileName: `documents/${uniqueFileName}`,
      data: buffer,
      contentType: file.type,
    });

    return Response.json({
      fileUrl: `https://f005.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/documents/${uniqueFileName}`,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
