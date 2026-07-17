import { SimpleItem } from "@/components/items";
import { data } from "@/data";

const skills = data.skills().skills;

export default async function Skills() {
  return (
    <ol className="me-list gap-1">
      {skills.map((item, i) => {
        return <SimpleItem key={`skills-item-${i}`} left={item.type} right={item.description} />;
      })}
    </ol>
  );
}
