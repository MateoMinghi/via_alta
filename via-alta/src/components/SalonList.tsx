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
<<<<<<< HEAD
  const [nuevoSalon, setNuevoSalon] = useState<Omit<Salon, "idsalon">>({
    tipo: "Normal",  // Establecer un valor predeterminado
=======
  const [nuevoSalon, setNuevoSalon] = useState<Salon>({
    idsalon: 0,
    tipo: "Normal",
>>>>>>> develop
    cupo: 0,
    nota: "",
  });
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSalon, setCurrentSalon] = useState<Salon | null>(null);
<<<<<<< HEAD
=======
  const [salonAEliminar, setSalonAEliminar] = useState<Salon | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
>>>>>>> develop

  const cargarSalones = async () => {
    const res = await fetch("/api/classroom");
    const data = await res.json();
    setSalones(data);
  };

  useEffect(() => {
    cargarSalones();
  }, []);

  const crearSalon = async () => {
<<<<<<< HEAD
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
=======
    if (currentSalon) {
      // Modo edición
      if (currentSalon.idsalon !== nuevoSalon.idsalon) {
        await fetch("/api/classroom", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: currentSalon.idsalon, campo: "idsalon", valor: nuevoSalon.idsalon }),
        });
      }

      await fetch("/api/classroom", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: nuevoSalon.idsalon, campo: "cupo", valor: nuevoSalon.cupo }),
      });

      await fetch("/api/classroom", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: nuevoSalon.idsalon, campo: "tipo", valor: nuevoSalon.tipo }),
      });

      await fetch("/api/classroom", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: nuevoSalon.idsalon, campo: "nota", valor: nuevoSalon.nota }),
      });
    } else {
      await fetch("/api/classroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoSalon),
      });
    }

    setNuevoSalon({ idsalon: 0, tipo: "Normal", cupo: 0, nota: "" });
    setCurrentSalon(null);
    cargarSalones();
    setIsDialogOpen(false);
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
    setNuevoSalon({ ...salon });
    setIsDialogOpen(true);
  };

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold tracking-tight text-gray-800">Gestión de Salones</h2>
>>>>>>> develop

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por tipo"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
<<<<<<< HEAD
        <Button onClick={() => setIsDialogOpen(true)}>
=======
        <Button
          onClick={() => {
            setIsDialogOpen(true);
            setCurrentSalon(null);
            setNuevoSalon({ idsalon: 0, tipo: "Normal", cupo: 0, nota: "" });
          }}
        >
>>>>>>> develop
          <Plus className="mr-2 h-4 w-4" />
          Agregar Salón
        </Button>
      </div>

<<<<<<< HEAD
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
=======
      <div className="overflow-x-auto rounded-lg shadow">
        <Table>
          <TableHeader className="bg-gray-100">
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
              <TableRow key={salon.idsalon} className="hover:bg-gray-50">
                <TableCell>{salon.idsalon}</TableCell>
                <TableCell>{salon.cupo}</TableCell>
                <TableCell>{salon.tipo}</TableCell>
                <TableCell>{salon.nota}</TableCell>
                <TableCell>
                  <Button
                    className="bg-red-800 hover:bg-red-700 text-white mr-2"
                    size="sm"
                    onClick={() => handleEditSalon(salon)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    className="bg-red-800 hover:bg-red-700 text-white"
                    size="sm"
                    onClick={() => {
                      setSalonAEliminar(salon);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
>>>>>>> develop

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
<<<<<<< HEAD
            <DialogTitle>{currentSalon ? "Editar Salón" : "Nuevo Salón"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
=======
            <DialogTitle className="text-xl font-semibold">
              {currentSalon ? "Editar Salón" : "Nuevo Salón"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="idsalon" className="text-right">ID Salón*</Label>
              <Input
                id="idsalon"
                type="number"
                value={nuevoSalon.idsalon}
                onChange={(e) =>
                  setNuevoSalon({ ...nuevoSalon, idsalon: Number(e.target.value) })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
>>>>>>> develop
              <Label htmlFor="tipo" className="text-right">Tipo*</Label>
              <div className="col-span-3">
                <Select
                  value={nuevoSalon.tipo}
<<<<<<< HEAD
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
=======
                  onValueChange={(value) =>
                    setNuevoSalon({ ...nuevoSalon, tipo: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Especial">Especial</SelectItem>
                    <SelectItem value="Ambos">Ambos</SelectItem>
                  </SelectContent>
>>>>>>> develop
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cupo" className="text-right">Cupo*</Label>
              <Input
                id="cupo"
                type="number"
                value={nuevoSalon.cupo}
<<<<<<< HEAD
                onChange={(e) => setNuevoSalon({ ...nuevoSalon, cupo: Number(e.target.value) })}
=======
                onChange={(e) =>
                  setNuevoSalon({ ...nuevoSalon, cupo: Number(e.target.value) })
                }
>>>>>>> develop
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nota" className="text-right">Nota</Label>
              <Input
                id="nota"
                value={nuevoSalon.nota}
<<<<<<< HEAD
                onChange={(e) => setNuevoSalon({ ...nuevoSalon, nota: e.target.value })}
=======
                onChange={(e) =>
                  setNuevoSalon({ ...nuevoSalon, nota: e.target.value })
                }
>>>>>>> develop
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
<<<<<<< HEAD
=======
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>¿Eliminar salón?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que deseas eliminar el salón con ID <strong>{salonAEliminar?.idsalon}</strong>?
            Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-red-700 text-white hover:bg-red-600"
              onClick={async () => {
                if (salonAEliminar) {
                  await eliminarSalon(salonAEliminar.idsalon);
                  setIsDeleteDialogOpen(false);
                  setSalonAEliminar(null);
                }
              }}
            >
              Eliminar
>>>>>>> develop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
