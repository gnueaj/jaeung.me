/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
// App router includes @vercel/og.
// No need to install it.

export const runtime = "edge";

async function loadGoogleFont(font: string, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${font}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/);

  if (resource) {
    const response = await fetch(resource[1]);
    if (response.status == 200) {
      return await response.arrayBuffer();
    }
  }

  throw new Error("failed to load font data");
}

function formatTitle(title: string | null, maxLength: number = 24, defaultString: string = "") {
  if (!title) return defaultString;
  if (title.length > maxLength) {
    return title.slice(0, maxLength - 3) + "...";
  }
  return title;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageURL = `/profilepic.png`;
    const absoluteImageURL = new URL(imageURL, request.url);

    // ?title=<title>
    const title = formatTitle(searchParams.get("title"), 24, "Jiwon Jason Choi");
    const description = formatTitle(
      searchParams.get("description"),
      50,
      "Research, Careers, and Personal Information",
    );

    return new ImageResponse(
      <div tw="text-white px-20 py-[80px] bg-[#030303] flex justify-between flex-col w-full h-full">
        <div tw="flex flex-col">
          <h1
            tw="text-transparent text-8xl m-0 mt-12 mb-2 tracking-tighter leading-[1.2] "
            style={{
              fontWeight: "900",
              textShadow: "0 2px 30px #000",
              backgroundImage: "linear-gradient(90deg, #fff 40%, #aaa)",
              backgroundClip: "text",
              // To preserve new line
              whiteSpace: "pre",
            }}>
            {title}
          </h1>
          <p tw="mb-4 text-3xl tracking-tight text-gray-400">{description}</p>
        </div>
        <div tw="flex items-center">
          <img
            src={absoluteImageURL.href}
            alt="profile"
            width={80}
            height={80}
            tw="rounded-lg mr-4"
          />
          <div tw="flex flex-col">
            <h3 tw="font-bold text-2xl m-0 mb-2">Jiwon Jason Choi</h3>
            <p tw="text-gray-400 text-lg m-0">Research Scientist & Software Engineer</p>
          </div>
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Noto Sans KR",
            data: await loadGoogleFont("Noto+Sans+KR:wght@500", `${title} ${description}`),
          },
        ],
      },
    );
  } catch (e) {
    console.error(e);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
