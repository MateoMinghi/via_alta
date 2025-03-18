import React, { useState } from 'react';
import {
  Plus, Pencil, Trash, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

export default function SalonCRUD() {
  const [classrooms, setClassrooms] = useState([
    {
      id: 1, name: 'Room 101', capacity: 25, type: 'Standard', isActive: true,
    },
    {
      id: 2, name: 'Art Studio', capacity: 15, type: 'Specialized', isActive: true,
    },
    {
      id: 3, name: 'Science Lab', capacity: 30, type: 'Specialized', isActive: false,
    },
    {
      id: 4, name: 'Computer Lab', capacity: 20, type: 'Specialized', isActive: true,
    },
    {
      id: 5, name: 'Room 205', capacity: 25, type: 'Standard', isActive: true,
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentClassroom, setCurrentClassroom] = useState<{ id: number; name: string; capacity: number; type: string; isActive: boolean } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    type: 'Standard',
    isActive: true,
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredClassrooms = classrooms.filter((classroom) => classroom.name.toLowerCase().includes(searchQuery.toLowerCase())
        || classroom.type.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleAddClassroom = () => {
    setCurrentClassroom(null);
    setFormData({
      name: '',
      capacity: '',
      type: 'Standard',
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const handleEditClassroom = (classroom: { id: number; name: string; capacity: number; type: string; isActive: boolean }) => {
    setCurrentClassroom(classroom);
    setFormData({
      name: classroom.name,
      capacity: classroom.capacity.toString(),
      type: classroom.type,
      isActive: classroom.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isActive: checked,
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      type: value,
    }));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.capacity) {
      alert('Please fill in all required fields');
      return;
    }

    if (currentClassroom) {
      setClassrooms((prev) => prev.map((item) => (item.id === (currentClassroom as any).id ? {
        ...item,
        name: formData.name,
        capacity: parseInt(formData.capacity),
        type: formData.type,
        isActive: formData.isActive,
      } : item)));
    } else {
      const newClassroom = {
        id: classrooms.length > 0 ? Math.max(...classrooms.map((c) => c.id)) + 1 : 1,
        name: formData.name,
        capacity: parseInt(formData.capacity),
        type: formData.type,
        isActive: formData.isActive,
      };
      setClassrooms((prev) => [...prev, newClassroom]);
    }

    setIsDialogOpen(false);
  };

  const handleDeleteClassroom = (id: number) => {
    if (window.confirm('Are you sure you want to delete this classroom?')) {
      setClassrooms((prev) => prev.filter((classroom) => classroom.id !== id));
    }
  };

  return (
    <div className="container mx-auto p-4">

      <div className="flex mb-4 justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search classrooms..."
            className="pl-8"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <Button onClick={handleAddClassroom}>
          <Plus className="mr-2 h-4 w-4" />
          {' '}
          Add Classroom
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClassrooms.length > 0 ? (
              filteredClassrooms.map((classroom) => (
                <TableRow key={classroom.id}>
                  <TableCell className="font-medium">{classroom.name}</TableCell>
                  <TableCell>{classroom.capacity}</TableCell>
                  <TableCell>{classroom.type}</TableCell>
                  <TableCell>
                    <Badge variant={classroom.isActive ? 'default' : 'secondary'}>
                        {classroom.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditClassroom(classroom)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteClassroom(classroom.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                      </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  No classrooms found.
                                    </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing
        {' '}
        {filteredClassrooms.length}
        {' '}
        of
        {classrooms.length}
        {' '}
        classrooms
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentClassroom ? 'Edit Classroom' : 'Add New Classroom'}</DialogTitle>
            <DialogDescription>
              {currentClassroom
                ? 'Make changes to the classroom here.'
                : 'Fill in the details to create a new classroom.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name*
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="capacity" className="text-right">
                Capacity*
              </Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select
                value={formData.type}
                onValueChange={handleSelectChange}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a classroom type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Specialized">Specialized</SelectItem>
                  <SelectItem value="Laboratory">Laboratory</SelectItem>
                  <SelectItem value="Conference">Conference</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                Active
              </Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={handleCheckboxChange}
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Classroom is active
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {currentClassroom ? 'Save Changes' : 'Create Classroom'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
