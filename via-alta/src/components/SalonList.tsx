import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Salon {
  idsalon: number;
  tipo: string;
  cupo: number;
  nota: string;
}

export default function SalonCRUD() {
  const [salones, setSalones] = useState<Salon[]>([]);
  const [nuevoSalon, setNuevoSalon] = useState<Omit<Salon, "idsalon">>({
    tipo: "Normal",  // Establecer un valor predeterminado
    cupo: 0,
    nota: "",
  });
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSalon, setCurrentSalon] = useState<Salon | null>(null);

  const cargarSalones = async () => {
    const res = await fetch("/api/classroom");
    const data = await res.json();
    setSalones(data);
  };

  useEffect(() => {
    cargarSalones();
  }, []);

  const crearSalon = async () => {
    await fetch("/api/classroom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevoSalon),
    });
    setNuevoSalon({ tipo: "Normal", cupo: 0, nota: "" });
    cargarSalones();
    setIsDialogOpen(false); // Cierra el diálogo después de crear el salón
  };

  const actualizarCampo = async (idsalon: number, campo: string, valor: string) => {
    await fetch("/api/classroom", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: idsalon, campo, valor }),
    });
    cargarSalones();
  };

  const eliminarSalon = async (idsalon: number) => {
    await fetch(`/api/classroom?id=${idsalon}`, { method: "DELETE" });
    cargarSalones();
  };

  const salonesFiltrados = salones.filter((s) =>
    s.tipo?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEditSalon = (salon: Salon) => {
    setCurrentSalon(salon);
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Gestión de Salones</h2>

      <div className="flex mb-4 justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por tipo"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Salón
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID Salón</TableHead>
            <TableHead>Cupo</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Nota</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {salonesFiltrados.map((salon) => (
            <TableRow key={salon.idsalon}>
              <TableCell>{salon.idsalon}</TableCell>
              <TableCell>{salon.cupo}</TableCell>
              <TableCell>{salon.tipo}</TableCell>
              <TableCell>{salon.nota}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => handleEditSalon(salon)} className="text-muted-foreground">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => eliminarSalon(salon.idsalon)} className="text-muted-foreground">
                  <Trash className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentSalon ? "Editar Salón" : "Nuevo Salón"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tipo" className="text-right">Tipo*</Label>
              <div className="col-span-3">
                <Select
                  value={nuevoSalon.tipo}
                  onValueChange={(value) => setNuevoSalon({ ...nuevoSalon, tipo: value })}
                >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Especial">Especial</SelectItem>
                  <SelectItem value="Ambos">Ambos</SelectItem>
                </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cupo" className="text-right">Cupo*</Label>
              <Input
                id="cupo"
                type="number"
                value={nuevoSalon.cupo}
                onChange={(e) => setNuevoSalon({ ...nuevoSalon, cupo: Number(e.target.value) })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nota" className="text-right">Nota</Label>
              <Input
                id="nota"
                value={nuevoSalon.nota}
                onChange={(e) => setNuevoSalon({ ...nuevoSalon, nota: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={crearSalon}>
              {currentSalon ? "Guardar Cambios" : "Crear Salón"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
