import { Date, MDXContent } from "@/components";
import { SimpleItem } from "@/components/items";
import { data } from "@/data";

const services = data.misc().services;

export default async function Services() {
  return (
    <ol className="me-list">
      {services.map((item) => {
        return (
          <SimpleItem
            key={`services-item-${item.id}`}
            left={item.date && <Date date={item.date} />}
            right={
              <div className="flex flex-col gap-1">
                <p className="not-prose text-base">
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
