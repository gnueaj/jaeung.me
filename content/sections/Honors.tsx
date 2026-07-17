import { Date, MDXContent } from "@/components";
import { SimpleItem } from "@/components/items";
import { data } from "@/data";

const honors = data.misc().honors;

export default async function Honors() {
  return (
    <ol className="me-list">
      {honors.map((item) => {
        return (
          <SimpleItem
            key={`honors-item-${item.id}`}
            left={item.date && <Date date={item.date} />}
            right={
              <div className="flex flex-col gap-1">
                <p className="not-prose">
                  <span className="font-semibold">{item.title}</span>
                  <span>{`, ${item.name}`}</span>
                </p>
                {item.description && (
                  <div className="border-primary border-opacity-50 mt-1 mb-2 ml-0.5 border-l-2 pl-4 text-sm">
                    <MDXContent mdxSource={item.description} />
                  </div>
                )}
              </div>
            }
          />
        );
      })}
    </ol>
  );
}
