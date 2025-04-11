import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DialogTitle, Dialog, DialogContent, DialogHeader, DialogFooter } from "../ui/dialog";

interface DataChunk {
  id: string;
  name: string;
  type: string;
  programme_id: string;
  data: string;
  metaData: any;
}

interface Props {
  chunk: DataChunk;
  onClose: () => void;
  onUpdate: (updatedChunk: DataChunk) => void;
}

const EditDataChunkModal: React.FC<Props> = ({ chunk, onClose, onUpdate }) => {
  const [formData, setFormData] = useState<DataChunk>(chunk);
  const [programmes, setProgrammes] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/programmes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setProgrammes(data.programmes);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const res = await fetch(`/api/data-chunk/${formData.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      const updatedChunk = await res.json();
      onUpdate(updatedChunk.dataChunk);
      onClose();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Data Chunk</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input name="name" value={formData.name} onChange={handleChange} placeholder="Name" />
          <Input name="data" value={formData.data} onChange={handleChange} placeholder="Data" />

          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="rich_text">Rich Text</SelectItem>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="link">Link</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={formData.programme_id}
            onValueChange={(value) => setFormData({ ...formData, programme_id: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Programme" />
            </SelectTrigger>
            <SelectContent>
              {programmes.map((programme) => (
                <SelectItem key={programme.id} value={programme.id}>
                  {programme.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditDataChunkModal;
