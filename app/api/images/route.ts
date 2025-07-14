import { NextApiRequest, NextApiResponse } from 'next';
import { Storage } from '@google-cloud/storage';
const theKey = process.env.PRIVATE_GCL;
const storage = new Storage({
  projectId: 'cj-tech-381914', // Replace with your project ID
  credentials: {
    client_email: 'todo-test@cj-tech-381914.iam.gserviceaccount.com',
    private_key: `-----BEGIN PRIVATE KEY-----\n${theKey}=\n-----END PRIVATE KEY-----\n`
    // Replace with your client email
    //private_key:  "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDrA6xL2pfXBn9s\nVLbPWwZrCzUdXqaagKWGiWeSyuzwUzfJVb3/osWYbP3MBF/1MUihdXKbR5z1ofBk\nxPQ1ex1PIUwRKXQEummH5KSeBrfZu6A3yy5wf34wXB3+zvzsesGm1fU5se7ZYB1R\n1YEdi4KQ5Z7X7H40jD78V2svJr4SGyQmHY8WJWVfp1zVLkFMgJLTanCFCF9jrPHi\n1qd6fVzvjhPVam0vogLFF1Pw/LpJdzSSr+aHV4N34MvQ3uDWsMwl8IDNkKUSaBBX\noAVmTFxBjKhD8UXi7lBbw8aM86HOsOTB8uDKmL7VvmZ0CSLScbPy8UlTOWaLOZ/N\nU8ZAqRj7AgMBAAECggEAHkONUwFVz1djXlh0aDRxGaTKVLtlGf1aE36rS1B9fZ9B\nzlgPzRUxe+UBM94WW1Va5Ivi09M/h7QwaFGinyZ5CkEf8g/UBG3a/Ch5+G2mDFBo\nm/a6xrrsTZ73L+KI2I0gVfM0jpb2yqBhdjHX3C2khTNEpsqqH+s1izpYr6w+Cseb\nzfG6zKpeGiFicYmuPyLQ+KydHWh6YTjLeK7q6CUNiarBoHa749xmq7DNcikGbKah\nOFkJKJvmJ6QmqSu3u/512uM3M+f4khJSMOjUeTTpaHHlKF7qw4ifjcRGPzovf70H\nb8griGvvb+lpIvXxvlFu2F81zsddhdHYH0xRTcoxOQKBgQD2u5Q6hkiuUhg1c4B8\nGy1tguvONKFyeXuWncWP9GTaMik7LXjdtsHEhNLeR8YzRl4B6C/NFxhR+fN0L83+\nIpm0l80jkKAAmUbeqO6hlQHcdJlWd+7rSmufMLeSd1jmdzzaq975x0+HqmC7gvLj\nn3aRFPMG22xT9OLLt8jnmt8ryQKBgQDz12rtv+PpQUsg7ED8TJPb8BeRKOeq32OF\nuOYXYqrZcQz2CuVXJ7HNMfNney7GTDc/SROQ07GSuZGav19zzC8uck4SNE4KSVPI\nT9L5AxJk0sAJnDOFPwer9EFc0oI3JnqZ7wUitNwMoZhz4+eOriUgx7JExg5uqL2R\n6D26eLp4owKBgQCCgKTeb7hxu6piWz1SZ22Xxu/CmcPrMKZV/A1LHxFY978nNd4A\nJ3JF55tBRuVmqYl/qLff2p9afMJwafiiutph0wkGDrESoAAENYZCoPXjDSktuzH7\n8dkK0lHGfqne/KKLZu0BYJKIR23ywEiIbQfhpRsGPXkGzzhGWGdDWX9BQQKBgCl4\nd50bx51CF47v31WJiJQdT0TG2i+7cmepvKg5hakZiwTFcZ/TBnBJkIYG8zuSdsry\nmLtG5ap4mQTii09caKHTmueJscQaGH+248Cp/xTaqwJ3aGO/BoT+M6efvbm3d556\ngjsW213ildUP66/eej4K+IytyoKTfDo2b1kpcz1VAoGAID6nXn7O/PJX7yIWP1xE\nl48109kmZ1CZPAlFx3gKBwAV8r92UuktodBX5BJQD/I89hTycbiD0wF/Rf9yzze9\nxQa0xBCdmNa+3ZJ7s/vhFsmYs0qpR2r7N8YQFVFfT2oTefZqOI/NRO+amb1kjHwA\nAW+RU+lacMnnjeSq2aOe1j4=\n-----END PRIVATE KEY-----\n"
  }
});

const bucket = storage.bucket('mnemo');
const CDN_BASE_URL = 'https://cdn.communityjameel.io/';

export async function GET(req: Request) {
  try {
    console.log('🟢 Fetching file list from bucket...');

    const [files] = await bucket.getFiles();
    if (!files.length) {
      return new Response(JSON.stringify({ files: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const fileList = files.map((file) => ({
      name: file.name,
      url: `${CDN_BASE_URL}${file.name}`
    }));

    console.log('🟢 Successfully retrieved files:', fileList);

    return new Response(JSON.stringify({ files: fileList }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('🔴 Error fetching files:', error);
    return new Response(JSON.stringify({ error: 'Failed to list files' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
