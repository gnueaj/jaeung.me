import { FullItem } from "@/components/items";
import { data } from "@/data";

const educations = data.educations().educations;

export default async function Educations() {
  return (
    <ol className="me-list gap-4">
      {educations.map((item) => {
        return (
          <FullItem
            key={`career-item-${item.id}`}
            date={{ from: item.from, to: item.to }}
            location={item.location}
            heading={item.name}
            subheading={item.title}
            description={item.description}
          />
        );
      })}
    </ol>
  );
}
